import type { MainCurrency } from "@/store/useSettingsStore"

export const localT = {
  id: {
    profileUpdated: "Profil berhasil diperbarui!",
    preferencesSaved: "Preferensi finansial berhasil disimpan!",
    themeChanged: "Tema diubah ke ",
    langChanged: "Bahasa diubah ke Bahasa Indonesia",
    exportSuccess: "Data berhasil diekspor ke file JSON!",
    importSuccess: "Data cadangan berhasil diimpor! Aplikasi akan memuat ulang...",
    importError: "File tidak valid! Pastikan file adalah backup Cashhero asli.",
    resetTitle: "Hapus Seluruh Data?",
    resetWarning: "Tindakan ini permanen dan tidak dapat dibatalkan! Semua data transaksi, investasi, perencanaan, bahasa, dan pengaturan akan dihapus bersih dari perangkat ini.",
    confirmReset: "Ya, Hapus Semua Data",
    cancel: "Batal",
    editProfile: "Ubah Profil",
    saveProfile: "Simpan Profil",
    fullName: "Nama Lengkap",
    email: "Alamat Email",
    securityMethod: "Metode Keamanan",
    pinAndBiometric: "PIN & Sidik Jari Aktif",
    securityPinToggle: "Gunakan PIN Keamanan",
    securityPinToggleDesc: "Minta PIN saat pertama kali aplikasi dibuka.",
    pinRegistered: "PIN Terdaftar",
    changePin: "Ubah Kode PIN",
    changePinDesc: "Ganti 6 digit kode akses keamanan Anda.",
    biometricToggle: "Aktifkan Sidik Jari / Biometrik",
    biometricToggleDesc: "Gunakan sensor sidik jari perangkat untuk login.",
    biometricActive: "Biometrik Siap",
    biometricNotRegistered: "Belum Didaftarkan",
    registerBiometricBtn: "Daftarkan Sidik Jari",
    currencyHelp: "Konversi global otomatis berdasarkan kurs riil saat ini.",
    autoLoggingDesc: "Simulasikan pencatatan periodik otomatis.",
    themeTitle: "Gaya Tema Visual",
    themeSystem: "Tema Sistem",
    themeDark: "Mode Gelap",
    themeLight: "Mode Terang",
    dbSettings: "Pengelolaan Database",
    exportTitle: "Ekspor Backup",
    exportDesc: "Simpan seluruh data ke file JSON lokal.",
    importTitle: "Impor Backup",
    importDesc: "Unggah file backup .json untuk memulihkan data.",
    resetBtn: "Reset Total Aplikasi",
    resetDesc: "Hapus cache dan seluruh database lokal.",
    dropBackup: "Seret & lepas file backup JSON di sini, atau klik untuk memilih",
    importBtn: "Impor Data",
    setNewPinTitle: "Masukkan PIN Baru",
    confirmNewPinTitle: "Konfirmasi PIN Baru",
    pinMismatch: "PIN tidak cocok! Silakan coba lagi.",
    pinSuccess: "PIN Keamanan berhasil diperbarui!",
    biometricRegisterSuccess: "Sensor biometrik berhasil diverifikasi dan terdaftar!",
    biometricRegisterError: "Gagal mendaftarkan biometrik. Pastikan perangkat Anda mendukung sidik jari/Windows Hello.",
    daily: "Harian",
    weekly: "Mingguan",
    monthly: "Bulanan",
    quarterly: "Kuarter",
    customPeriod: "Periode Kustom",
  },
  en: {
    profileUpdated: "Profile successfully updated!",
    preferencesSaved: "Financial preferences successfully saved!",
    themeChanged: "Theme changed to ",
    langChanged: "Language changed to English",
    exportSuccess: "Data successfully exported to JSON file!",
    importSuccess: "Backup data successfully imported! Reloading application...",
    importError: "Invalid file! Make sure it is an authentic Cashhero backup.",
    resetTitle: "Reset All Application Data?",
    resetWarning: "This action is permanent and cannot be undone! All transactions, investments, planning, language, and settings will be permanently erased from this device.",
    confirmReset: "Yes, Reset All Data",
    cancel: "Cancel",
    editProfile: "Edit Profile",
    saveProfile: "Save Profile",
    fullName: "Full Name",
    email: "Email Address",
    securityMethod: "Security Method",
    pinAndBiometric: "PIN & Biometrics Active",
    securityPinToggle: "Use Security PIN",
    securityPinToggleDesc: "Request PIN code when the application is launched.",
    pinRegistered: "PIN Registered",
    changePin: "Change PIN Code",
    changePinDesc: "Replace your 6-digit security access code.",
    biometricToggle: "Enable Fingerprint / Biometrics",
    biometricToggleDesc: "Use device fingerprint sensor to authenticate.",
    biometricActive: "Biometrics Ready",
    biometricNotRegistered: "Not Registered",
    registerBiometricBtn: "Register Fingerprint",
    currencyHelp: "Automatic global conversion based on active exchange rates.",
    autoLoggingDesc: "Simulate automatic periodic logging.",
    themeTitle: "Visual Theme Style",
    themeSystem: "System Theme",
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    dbSettings: "Database Management",
    exportTitle: "Export Backup",
    exportDesc: "Save all data to a local JSON file.",
    importTitle: "Import Backup",
    importDesc: "Upload a backup .json file to restore data.",
    resetBtn: "Reset Application",
    resetDesc: "Clear browser cache and wipe local database.",
    dropBackup: "Drag & drop JSON backup file here, or click to browse",
    importBtn: "Import Data",
    setNewPinTitle: "Enter New PIN",
    confirmNewPinTitle: "Confirm New PIN",
    pinMismatch: "PIN mismatch! Please try again.",
    pinSuccess: "Security PIN successfully updated!",
    biometricRegisterSuccess: "Biometric sensor verified and registered successfully!",
    biometricRegisterError: "Failed to register biometrics. Ensure your device supports fingerprint/Windows Hello.",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    customPeriod: "Custom Period",
  }
}

export function useLt(mounted: boolean, language: 'id' | 'en') {
  return (key: keyof typeof localT['id']) => {
    if (!mounted) return localT['id'][key]
    return localT[language]?.[key] || localT['id'][key]
  }
}

export const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      when: "beforeChildren" as const,
      staggerChildren: 0.08
    }
  }
}

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

export const bufferToBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

export const getInitials = (name: string) => {
  const parts = name.trim().split(" ")
  if (parts.length === 0 || !parts[0]) return "CF"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export const currencyOptions: { value: MainCurrency; label: string }[] = [
  { value: "IDR", label: "IDR (Rupiah - Rp)" },
  { value: "USD", label: "USD (US Dollar - $)" },
  { value: "EUR", label: "EUR (Euro - €)" },
  { value: "SGD", label: "SGD (Singapore Dollar - S$)" },
  { value: "JPY", label: "JPY (Japanese Yen - ¥)" },
]

export function getFilterOptions(t: (key: string) => string) {
  return [
    { value: "daily" as const, label: t('daily') },
    { value: "weekly" as const, label: t('weekly') },
    { value: "monthly" as const, label: t('monthly') },
    { value: "quarterly" as const, label: t('quarterly') },
    { value: "customPeriod" as const, label: t('customPeriod') },
  ]
}
