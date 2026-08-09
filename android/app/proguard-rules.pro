# ProGuard rules for MediCareAI

# Keep model classes for serialization
-keep class com.medicareai.patient.data.model.** { *; }

# Keep ViewModels
-keep class * extends androidx.lifecycle.ViewModel { *; }

# Keep Hilt
-keep class * extends android.app.Application { *; }
-keep class * extends android.content.Context { *; }

# Ktor
-keep class io.ktor.** { *; }
-dontwarn io.ktor.**

# Kotlinx Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** { *; }

# General Android
-keepattributes Signature
-keepattributes Exceptions
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeInvisibleAnnotations
-keepattributes RuntimeVisibleParameterAnnotations
-keepattributes RuntimeInvisibleParameterAnnotations