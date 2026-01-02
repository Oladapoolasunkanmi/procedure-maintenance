import { Zap, Wrench, RefreshCw, Snowflake, ShieldCheck, FileText } from "lucide-react"

export const CATEGORIES_MOCK = [
    { id: "electrical", label: "Electrical", icon: Zap, color: "text-yellow-500 bg-yellow-500/10" },
    { id: "mechanical", label: "Mechanical", icon: Wrench, color: "text-purple-500 bg-purple-500/10" },
    { id: "preventive", label: "Preventive", icon: RefreshCw, color: "text-green-500 bg-green-500/10" },
    { id: "refrigeration", label: "Refrigeration", icon: Snowflake, color: "text-cyan-500 bg-cyan-500/10" },
    { id: "safety", label: "Safety", icon: ShieldCheck, color: "text-teal-500 bg-teal-500/10" },
    { id: "sop", label: "Standard Operating Procedure", icon: FileText, color: "text-pink-500 bg-pink-500/10" },
]
