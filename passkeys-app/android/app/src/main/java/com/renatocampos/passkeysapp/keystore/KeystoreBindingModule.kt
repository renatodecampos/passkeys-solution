package com.renatocampos.passkeysapp.keystore

import android.os.Build
import android.util.Log
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.KeyProperties
import android.security.keystore.UserNotAuthenticatedException
import android.util.Base64
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.renatocampos.passkeysapp.BuildConfig
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.InvalidKeyException
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.KeyStoreException
import java.security.PrivateKey
import java.security.ProviderException
import java.security.Signature
import java.security.UnrecoverableKeyException

class KeystoreBindingModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  /**
   * initSign (and less often update/sign) can throw [UserNotAuthenticatedException] **or** a
   * generic [KeyStoreException] / [InvalidKeyException] / [ProviderException] whose message or cause
   * indicates the same — depending on API level and provider. We must show [BiometricPrompt] in
   * all of those cases, not only on [UserNotAuthenticatedException].
   */
  private fun indicatesUserNotAuthenticated(throwable: Throwable?): Boolean {
    var t: Throwable? = throwable
    while (t != null) {
      when (t) {
        is UserNotAuthenticatedException -> return true
        is android.security.KeyStoreException -> {
          if (t.message?.contains("not authenticated", ignoreCase = true) == true) {
            return true
          }
        }
      }
      if (t is KeyStoreException) {
        if (t.message?.contains("not authenticated", ignoreCase = true) == true) {
          return true
        }
      }
      if (t is InvalidKeyException) {
        if (t.cause is UserNotAuthenticatedException) {
          return true
        }
        if (t.message?.contains("not authenticated", ignoreCase = true) == true) {
          return true
        }
      }
      if (t is ProviderException && t.cause != null) {
        if (indicatesUserNotAuthenticated(t.cause)) {
          return true
        }
      }
      val m = t.message
      if (m != null) {
        if (m.contains("not authenticated", ignoreCase = true) &&
          (m.contains("keystore", ignoreCase = true) || m.contains("key user", ignoreCase = true))
        ) {
          return true
        }
        if (m.contains("user not authenticated", ignoreCase = true)) {
          return true
        }
      }
      val cn = t.javaClass.name
      if (cn.contains("keystore", ignoreCase = true) && m?.contains("not authenticated", ignoreCase = true) == true) {
        return true
      }
      t = t.cause
    }
    return false
  }

  /** Keystore/TEE can wrap [KeyPermanentlyInvalidatedException] in [InvalidKeyException] / [ProviderException]. */
  private fun indicatesPermanentlyInvalidated(throwable: Throwable?): Boolean {
    var t: Throwable? = throwable
    while (t != null) {
      if (t is KeyPermanentlyInvalidatedException) return true
      if (t is UnrecoverableKeyException) {
        if (t.message?.contains("invalidat", ignoreCase = true) == true) return true
      }
      val m = t.message?.lowercase() ?: ""
      if (m.contains("permanently") && m.contains("invalidat")) return true
      if (m.contains("key permanently invalidated")) return true
      if (t.javaClass.name.contains("KeyPermanentlyInvalidated", ignoreCase = true)) return true
      t = t.cause
    }
    return false
  }

  private fun isStrongBoxUnavailable(e: Exception): Boolean {
    // API 28+; avoid hard dependency name on older compile stubs
    if (e.javaClass.name == "android.security.keystore.StrongBoxUnavailableException") return true
    if (e.cause?.javaClass?.name == "android.security.keystore.StrongBoxUnavailableException") {
      return true
    }
    return false
  }

  private fun keyGenBuilder(strongBox: Boolean): KeyGenParameterSpec.Builder {
    val b = KeyGenParameterSpec.Builder(
      KEY_ALIAS,
      KeyProperties.PURPOSE_SIGN
    )
      .setAlgorithmParameterSpec(java.security.spec.ECGenParameterSpec("secp256r1"))
      .setDigests(KeyProperties.DIGEST_SHA256)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && strongBox) {
      b.setIsStrongBoxBacked(true)
    }
    b.setUserAuthenticationRequired(true)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      b.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      b.setInvalidatedByBiometricEnrollment(true)
    }
    return b
  }

  private fun generateEcBindingKey(tryStrongBox: Boolean) {
    val kpg = KeyPairGenerator.getInstance(
      KeyProperties.KEY_ALGORITHM_EC,
      "AndroidKeyStore"
    )
    val spec = keyGenBuilder(tryStrongBox).build()
    kpg.initialize(spec)
    kpg.generateKeyPair()
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun createKey(promise: Promise) {
    try {
      deleteKeyIfExists()
      deleteKeyIfExists(V2_KEY_ALIAS)
      deleteKeyIfExists(LEGACY_KEY_ALIAS)
      var usedStrongBox: Boolean? = null
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        try {
          generateEcBindingKey(tryStrongBox = true)
          usedStrongBox = true
        } catch (e: Exception) {
          if (isStrongBoxUnavailable(e)) {
            generateEcBindingKey(tryStrongBox = false)
            usedStrongBox = false
            if (BuildConfig.DEBUG) {
              Log.d(LOG_TAG, "createKey: StrongBox unavailable, using TEE")
            }
          } else {
            throw e
          }
        }
      } else {
        generateEcBindingKey(tryStrongBox = false)
        usedStrongBox = null
      }
      if (BuildConfig.DEBUG) {
        Log.d(
          LOG_TAG,
          "createKey: ok alias=$KEY_ALIAS strongBox=${usedStrongBox ?: "n/a (preP)"} sdk=${Build.VERSION.SDK_INT}"
        )
      }
      val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
      val cert = keyStore.getCertificate(KEY_ALIAS) ?: run {
        promise.reject("E_NO_CERT", "No certificate after key generation")
        return
      }
      val b64 = Base64.encodeToString(cert.publicKey.encoded, Base64.NO_WRAP)
      val out = Arguments.createMap()
      out.putString("publicKeySpkiB64", b64)
      out.putString("algorithm", "P-256")
      promise.resolve(out)
    } catch (e: Exception) {
      promise.reject("E_CREATE", e.message, e)
    }
  }

  @ReactMethod
  fun signChallenge(challenge: String, promise: Promise) {
    val act = currentActivity
    if (act !is FragmentActivity) {
      promise.reject("E_NO_ACTIVITY", "FragmentActivity required")
      return
    }
    if (challenge.isEmpty()) {
      promise.reject("E_ARG", "challenge is empty")
      return
    }
    val data = challenge.toByteArray(Charsets.UTF_8)
    val privateKey: PrivateKey
    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
      if (!keyStore.containsAlias(KEY_ALIAS)) {
        val err = Arguments.createMap()
        err.putBoolean("ok", false)
        err.putString("code", "no_key")
        promise.resolve(err)
        return
      }
      privateKey = keyStore.getKey(KEY_ALIAS, null) as PrivateKey
    } catch (e: KeyPermanentlyInvalidatedException) {
      resolveLost(promise)
      return
    } catch (e: Exception) {
      if (indicatesPermanentlyInvalidated(e)) {
        resolveLost(promise)
        return
      }
      promise.reject("E_KEY", e.message, e)
      return
    }

    val signature = Signature.getInstance("SHA256withECDSA")
    try {
      signature.initSign(privateKey)
    } catch (e: KeyPermanentlyInvalidatedException) {
      resolveLost(promise)
      return
    } catch (e: Exception) {
      if (indicatesPermanentlyInvalidated(e)) {
        resolveLost(promise)
        return
      }
      // On pre-Keystore2 devices, initSign may throw UserNotAuthenticatedException.
      // The Keystore operation still exists pending authentication — pass to BiometricPrompt.
      if (!indicatesUserNotAuthenticated(e)) {
        promise.reject("E_SIGN_INIT", e.message, e)
        return
      }
    }
    // On Keystore2 (API 31+), initSign succeeds but sign() requires an auth token bound at
    // finish time. Always route through BiometricPrompt so the token is bound before sign().
    runBiometricPrompt(act, signature, data, promise)
  }

  /**
   * OEM issue (e.g. Samsung): face / weak biometrics can show "cannot participate in Keystore
   * operations" and keystore2 fails on finish. Prefer **strong biometrics** only, else **device
   * credential** only — avoid OR in one prompt, which can pick a bad modality for CryptoObject.
   */
  private fun runBiometricPrompt(
    act: FragmentActivity,
    signature: Signature,
    data: ByteArray,
    promise: Promise
  ) {
    val crypto = BiometricPrompt.CryptoObject(signature)
    val executor = ContextCompat.getMainExecutor(reactContext)
    // Matches createKey: strong biometric only (no device-credential-only unlock for this op).
    val allowed: Int
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      allowed = Authenticators.BIOMETRIC_STRONG
    } else {
      @Suppress("DEPRECATION")
      allowed = Authenticators.BIOMETRIC_STRONG
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      if (BiometricManager.from(reactContext).canAuthenticate(allowed) != BiometricManager.BIOMETRIC_SUCCESS) {
        val err = Arguments.createMap()
        err.putBoolean("ok", false)
        err.putString("code", "error")
        err.putString("message", "biometric_unavailable")
        promise.resolve(err)
        return
      }
    }
    val prompt = BiometricPrompt(
      act,
      executor,
      object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
          val sig = result.cryptoObject?.signature
          if (sig == null) {
            val err = Arguments.createMap()
            err.putBoolean("ok", false)
            err.putString("code", "error")
            err.putString("message", "no_crypto_signature")
            promise.resolve(err)
            return
          }
          try {
            sig.update(data)
            val sigBytes = sig.sign()
            resolveOk(promise, sigBytes, "biometric")
          } catch (e: KeyPermanentlyInvalidatedException) {
            resolveLost(promise)
          } catch (e: Exception) {
            if (indicatesPermanentlyInvalidated(e)) {
              resolveLost(promise)
            } else {
              promise.reject("E_SIGN", e.message, e)
            }
          }
        }

        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          if (errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
            errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
            errorCode == BiometricPrompt.ERROR_CANCELED
          ) {
            val err = Arguments.createMap()
            err.putBoolean("ok", false)
            err.putString("code", "cancelled")
            err.putString("message", errString.toString())
            promise.resolve(err)
            return
          }
          val err = Arguments.createMap()
          err.putBoolean("ok", false)
          err.putString("code", "error")
          err.putString("message", "auth_$errorCode: $errString")
          promise.resolve(err)
        }

        override fun onAuthenticationFailed() {
          val err = Arguments.createMap()
          err.putBoolean("ok", false)
          err.putString("code", "error")
          err.putString("message", "auth_failed")
          promise.resolve(err)
        }
      }
    )
    val infoBuilder = BiometricPrompt.PromptInfo.Builder()
      .setTitle("Confirm it’s you")
      .setSubtitle("Binding proof (PoC)")
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      infoBuilder.setAllowedAuthenticators(allowed)
    } else {
      @Suppress("DEPRECATION")
      infoBuilder
        .setDeviceCredentialAllowed(true)
        .setAllowedAuthenticators(Authenticators.BIOMETRIC_STRONG)
    }
    try {
      prompt.authenticate(infoBuilder.build(), crypto)
    } catch (e: Exception) {
      promise.reject("E_PROMPT", e.message, e)
    }
  }

  private fun resolveOk(promise: Promise, sigBytes: ByteArray, unlockHint: String) {
    val out = Arguments.createMap()
    out.putBoolean("ok", true)
    out.putString("signature", Base64.encodeToString(sigBytes, Base64.NO_WRAP))
    out.putString("unlockHint", unlockHint)
    promise.resolve(out)
  }

  private fun resolveLost(promise: Promise) {
    if (BuildConfig.DEBUG) {
      Log.d(LOG_TAG, "sign: lost (key invalidated or no longer usable for binding)")
    }
    val err = Arguments.createMap()
    err.putBoolean("ok", false)
    err.putString("code", "lost")
    promise.resolve(err)
  }

  private fun deleteKeyIfExists() {
    deleteKeyIfExists(KEY_ALIAS)
  }

  private fun deleteKeyIfExists(alias: String) {
    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
      if (keyStore.containsAlias(alias)) {
        keyStore.deleteEntry(alias)
      }
    } catch (_: Exception) {
    }
  }

  companion object {
    const val NAME = "KeystoreBinding"
    private const val LOG_TAG = "KeystoreBinding"
    private const val KEY_ALIAS = "passkeys_keystore_binding_p256_v3"
    private const val V2_KEY_ALIAS = "passkeys_keystore_binding_p256_v2"
    private const val LEGACY_KEY_ALIAS = "passkeys_keystore_binding_p256"
  }
}
