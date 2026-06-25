import * as React from "react"
import { Handshake, Landmark, Receipt, Clock } from "lucide-react"

export const JENIS_ICONS: Record<string, React.ElementType> = {
  piutang: Handshake,
  deposit: Landmark,
  kasbon: Receipt,
  temporary: Clock,
}

export const JENIS_INFO: Record<string, { icon: React.ElementType; desc_id: string; desc_en: string }> = {
  piutang:  { icon: Handshake, desc_id: 'Uang dipinjamkan ke orang lain, diharapkan kembali.', desc_en: 'Money lent to others, expected to be returned.' },
  deposit:  { icon: Landmark,  desc_id: 'Uang jaminan atau deposit yang bisa ditarik kembali.', desc_en: 'Security deposit that can be withdrawn.' },
  kasbon:   { icon: Receipt,   desc_id: 'Uang muka atau pinjaman dari kantor/instansi.', desc_en: 'Advance payment or company loan.' },
  temporary:{ icon: Clock,     desc_id: 'Pengeluaran sementara yang akan dibayar balik.', desc_en: 'Temporary expense to be reimbursed.' },
}

export const CUSTOM_KEY = '__custom__'
