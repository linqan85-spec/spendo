import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface MonthSelectorProps {
  months: Array<{ year: number; month: number; label: string }>;
  selectedYear: number;
  selectedMonth: number;
  onSelect: (year: number, month: number) => void;
}

export function MonthSelector({
  months,
  selectedYear,
  selectedMonth,
  onSelect,
}: MonthSelectorProps) {
  const { t } = useTranslation();
  const currentValue = `${selectedYear}-${selectedMonth}`;

  const handleChange = (value: string) => {
    const [year, month] = value.split("-").map(Number);
    onSelect(year, month);
  };

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={t("dashboard.month_selector.placeholder")} />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
