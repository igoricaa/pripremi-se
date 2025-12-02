import { Button as EmailButton } from "@react-email/components";

type ButtonProps = {
	href: string;
	children: React.ReactNode;
	variant?: "primary" | "secondary";
	className?: string;
};

export const Button = ({
	href,
	children,
	variant = "primary",
	className,
}: ButtonProps) => {
	const styles =
		variant === "primary"
			? "bg-primary text-black"
			: "bg-transparent text-primary border border-primary";

	return (
		<EmailButton
			className={`${styles} box-border inline-block rounded-md px-8 py-4 font-semibold text-base no-underline ${className || ""}`}
			href={href}
		>
			{children}
		</EmailButton>
	);
};
