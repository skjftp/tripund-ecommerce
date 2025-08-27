# Razorpay
-keep class com.razorpay.** { *; }
-keepclasseswithmembers class * {
  @proguard.annotation.Keep <methods>;
}
-keepclasseswithmembers class * {
  @proguard.annotation.KeepClassMembers <methods>;
}
-dontwarn proguard.annotation.Keep
-dontwarn proguard.annotation.KeepClassMembers
-dontwarn com.razorpay.**
-dontwarn com.google.android.gms.**
-keepattributes *Annotation*