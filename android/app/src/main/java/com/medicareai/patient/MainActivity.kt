package com.medicareai.patient

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.medicareai.patient.auth.AppLifecycleObserver
import com.medicareai.patient.data.auth.AuthEventBus
import com.medicareai.patient.ui.screens.*
import com.medicareai.patient.ui.theme.MediCareAITheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var appLifecycleObserver: AppLifecycleObserver

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        appLifecycleObserver.init()

        setContent {
            MediCareAITheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MediCareAppWithAuth()
                }
            }
        }
    }
}

@Composable
fun MediCareAppWithAuth() {
    val navController = rememberNavController()
    var pendingRoute by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        AuthEventBus.events.collect { event ->
            when (event) {
                is AuthEventBus.AuthEvent.TokenExpired -> {
                    pendingRoute = event.targetRoute
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
                is AuthEventBus.AuthEvent.ReLoginSuccess -> {
                    pendingRoute?.let { route ->
                        navController.navigate(route) {
                            popUpTo(0) { inclusive = true }
                        }
                        pendingRoute = null
                    } ?: navController.navigate(Screen.Dashboard.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            }
        }
    }

    MediCareApp(navController = navController, pendingRoute = pendingRoute)
}

@Composable
fun MediCareApp(
    navController: NavHostController = rememberNavController(),
    pendingRoute: String? = null
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Welcome.route
    ) {
        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onNavigateToLogin = { navController.navigate(Screen.Login.route) },
                onNavigateToRegister = { navController.navigate(Screen.Register.route) }
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                onLoginSuccess = {
                    AuthEventBus.emitReLoginSuccess()
                }
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                onNavigateToLogin = { navController.popBackStack() },
                onRegisterSuccess = {
                    navController.navigate(Screen.VerifyEmail.route) {
                        popUpTo(Screen.Login.route)
                    }
                }
            )
        }

        composable(Screen.VerifyEmail.route) {
            VerifyEmailScreen(
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = false }
                    }
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToProfile = { navController.navigate(Screen.Profile.route) },
                onNavigateToSymptomSubmit = { navController.navigate(Screen.SymptomSubmit.route) },
                onNavigateToMedicalRecords = { navController.navigate(Screen.MedicalRecords.route) },
                onLogout = {
                    navController.navigate(Screen.Welcome.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.SymptomSubmit.route) {
            SymptomSubmitScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.MedicalRecords.route) {
            MedicalRecordsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

sealed class Screen(val route: String) {
    object Welcome : Screen("welcome")
    object Login : Screen("login")
    object Register : Screen("register")
    object VerifyEmail : Screen("verify_email")
    object Dashboard : Screen("dashboard")
    object Profile : Screen("profile")
    object SymptomSubmit : Screen("symptom_submit")
    object MedicalRecords : Screen("medical_records")
}