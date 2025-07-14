import { CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import classNames from 'classnames';
import { cn } from '@/lib/utils';

interface ApplicationCardProps {
  icon: string;
  iconAlt: string;
  title: string;
  subtitle: string;
  description: string;
  iconBgColor: string;
  checkColor: string;
  link?: string;
  shadowColor?: string;
}

export function ApplicationCard({ icon, iconAlt, title, subtitle, description, iconBgColor, checkColor, link, shadowColor }: ApplicationCardProps) {
  // Use a stronger shadow in dark mode, but keep it subtle
  const darkShadow = shadowColor ? shadowColor.replace(/0\.15\)/, '0.35)') : undefined;
  const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const appliedShadow = shadowColor ? (isDark ? darkShadow : shadowColor) : undefined;

  const content = (
    <Card
      className={cn(
        classNames('border rounded-xl transition-shadow duration-200', { 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/30': link })
      )}
      style={{
        boxShadow: appliedShadow ? `0 2px 16px 0 ${appliedShadow}` : undefined,
      }}
    >
      <CardContent className="py-1 px-2">
        <div className="flex items-center gap-3 min-h-[3.5rem]">
          <div
            className={cn('flex items-center justify-center rounded-lg relative', iconBgColor)}
            style={{ minWidth: '3.5rem', minHeight: '3.5rem' }}
          >
            <img src={icon} alt={iconAlt} className="h-14 w-14 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground leading-tight">{subtitle}</p>
            <p className="text-xs text-muted-foreground leading-tight">{description}</p>
          </div>
          {/* Use ExternalLink icon if clickable, else CheckCircle */}
          {link ? (
            <ExternalLink className={cn('h-4 w-4 flex-shrink-0', checkColor)} />
          ) : (
            <CheckCircle className={cn('h-4 w-4 flex-shrink-0', checkColor)} />
          )}
        </div>
      </CardContent>
    </Card>
  );

  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    content
  );
}
