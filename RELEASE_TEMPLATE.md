# MediCareAI Android 应用发布模板

## 应用信息
- **应用名称**: MediCareAI
- **包名**: com.medicareai.patient
- **版本号**: 1.0.0
- **版本代码**: 1
- **编译 SDK**: 34
- **最低 SDK**: 26 (Android 8.0)
- **目标 SDK**: 34

## 构建 Release APK

### 方式 1：使用环境变量（推荐）
```bash
export KEYSTORE_PASSWORD=你的密钥库密码
export KEY_ALIAS=medicareai
export KEY_PASSWORD=你的密钥密码
cd android
./gradlew assembleRelease
```

### 方式 2：手动签名（如果未配置签名）
```bash
cd android
./gradlew assembleRelease
# 然后使用 jarsigner 手动签名
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore app/medicareai-release.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  medicareai
```

## 签名信息（本地保存，不要上传）
- **密钥库文件**: `android/app/medicareai-release.keystore`
- **密钥别名**: `medicareai`
- **密码**: 请查看本地密码管理器或笔记

⚠️ **警告**: 请务必备份并安全保存密钥库文件和密码！丢失后将无法更新应用。

## 应用功能
- 智能疾病管理
- AI 辅助诊断
- 医患沟通平台
- 病历管理
- 特慢病管理
- 文档上传与处理

## 技术栈
- **架构**: MVVM + Jetpack Compose
- **网络**: Ktor Client
- **依赖注入**: Hilt
- **本地存储**: DataStore
- **后端 API**: https://openmedicareai.life/api/v1/

## 应用汇发布注意事项
1. 应用图标已配置（mipmap 各分辨率）
2. 应用名称: MediCareAI
3. 需要权限:
   - 网络访问
   - 存储访问（文档上传）
4. 支持 Android 8.0+ (API 26+)

## 发布前检查清单
- [ ] 更新版本号（versionCode 和 versionName）
- [ ] 测试 Release 构建
- [ ] 准备应用截图（3-5张）
- [ ] 准备应用描述
- [ ] 备份密钥库文件
