import { Search, X } from 'lucide-react';
import type * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps
	extends Omit<React.ComponentProps<'input'>, 'onChange'> {
	value: string;
	onChange: (value: string) => void;
}

function SearchInput({
	value,
	onChange,
	placeholder = 'Search...',
	className,
	...props
}: SearchInputProps) {
	return (
		<div className={cn('relative', className)}>
			<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				className="pl-9 pr-9"
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				type="text"
				value={value}
				{...props}
			/>
			{value && (
				<Button
					className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
					onClick={() => onChange('')}
					size="icon-sm"
					type="button"
					variant="ghost"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Clear search</span>
				</Button>
			)}
		</div>
	);
}

export { SearchInput };
