package com.medicareai.patient.auth

import android.util.Log
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.lifecycle.lifecycleScope
import com.medicareai.patient.data.auth.AuthEventBus
import com.medicareai.patient.data.repository.AuthRepository
import dagger.hilt.android.scopes.ActivityRetainedScoped
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * 应用生命周期监听器
 * 监听应用从前台到后台的切换，自动刷新 Token
 */
@Singleton
class AppLifecycleObserver @Inject constructor(
    private val authRepository: AuthRepository
) : DefaultLifecycleObserver {

    companion object {
        private const val TAG = "AppLifecycleObserver"
    }

    private var isInitialized = false

    /**
     * 初始化并注册到 ProcessLifecycleOwner
     */
    fun init() {
        if (!isInitialized) {
            ProcessLifecycleOwner.get().lifecycle.addObserver(this)
            isInitialized = true
            Log.d(TAG, "AppLifecycleObserver initialized")
        }
    }

    /**
     * 应用从后台切换到前台时调用
     */
    override fun onStart(owner: LifecycleOwner) {
        super.onStart(owner)
        Log.d(TAG, "App moved to foreground, checking token...")

        owner.lifecycleScope.launch {
            try {
                // 加载保存的 Token
                authRepository.loadSavedToken()

                // 检查 Token 是否即将过期（提前5分钟）
                if (authRepository.shouldRefreshToken()) {
                    Log.d(TAG, "Token needs refresh, attempting to refresh...")

                    // 尝试刷新 Token
                    val refreshed = authRepository.refreshAccessToken()

                    if (refreshed) {
                        Log.d(TAG, "Token refreshed successfully")
                    } else {
                        Log.w(TAG, "Token refresh failed, may need to re-login")
                        // 发送 Token 过期事件，让 UI 处理
                        AuthEventBus.emitTokenExpired()
                    }
                } else {
                    Log.d(TAG, "Token is valid")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error checking/refreshing token", e)
                AuthEventBus.emitTokenExpired()
            }
        }
    }

    /**
     * 应用从前台切换到后台时调用
     */
    override fun onStop(owner: LifecycleOwner) {
        super.onStop(owner)
        Log.d(TAG, "App moved to background")
    }
}