import type { ReactNode } from 'react';
import { DropdownMenuItem } from './dropdown-menu';
import classNames from 'classnames';

interface SelectableDropdownMenuItemProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export function SelectableDropdownMenuItem({ selected, onClick, children, className }: SelectableDropdownMenuItemProps) {
  return (
    <DropdownMenuItem onClick={onClick} className={classNames({ 'bg-primary/10 text-primary font-bold': selected }, className)}>
      {children}
    </DropdownMenuItem>
  );
}
