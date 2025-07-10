import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ApplicationCardProps {
  icon: string;
  iconAlt: string;
  title: string;
  subtitle: string;
  description: string;
  iconBgColor: string;
  checkColor: string;
}

export function ApplicationCard({ icon, iconAlt, title, subtitle, description, iconBgColor, checkColor }: ApplicationCardProps) {
  return (
    <Card className="border rounded-xl shadow-sm">
      <CardContent className="p-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBgColor} rounded-lg`}>
            <img src={icon} alt={iconAlt} className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground leading-tight">{subtitle}</p>
            <p className="text-xs text-muted-foreground leading-tight">{description}</p>
          </div>
          <CheckCircle className={`h-4 w-4 ${checkColor} flex-shrink-0`} />
        </div>
      </CardContent>
    </Card>
  );
}
