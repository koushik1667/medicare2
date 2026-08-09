package com.medicareai.patient.data.auth

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

object AuthEventBus {
    sealed class AuthEvent {
        data class TokenExpired(val targetRoute: String) : AuthEvent()
        object ReLoginSuccess : AuthEvent()
    }

    private val _events = MutableSharedFlow<AuthEvent>(extraBufferCapacity = 1)
    val events: SharedFlow<AuthEvent> = _events.asSharedFlow()

    fun emitTokenExpired(targetRoute: String = AuthScreen.DASHBOARD) {
        _events.tryEmit(AuthEvent.TokenExpired(targetRoute))
    }

    fun emitReLoginSuccess() {
        _events.tryEmit(AuthEvent.ReLoginSuccess)
    }
}

object AuthScreen {
    const val WELCOME = "welcome"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val VERIFY_EMAIL = "verify_email"
    const val DASHBOARD = "dashboard"
    const val PROFILE = "profile"
    const val SYMPTOM_SUBMIT = "symptom_submit"
    const val MEDICAL_RECORDS = "medical_records"
}