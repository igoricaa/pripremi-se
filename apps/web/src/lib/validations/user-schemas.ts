import { z } from 'zod';

// Sign up validation schema
export const signUpSchema = z
	.object({
		firstName: z
			.string()
			.min(1, 'First name is required')
			.min(2, 'First name must be at least 2 characters')
			.max(50, 'First name must be less than 50 characters'),
		lastName: z
			.string()
			.min(1, 'Last name is required')
			.min(2, 'Last name must be at least 2 characters')
			.max(50, 'Last name must be less than 50 characters'),
		email: z
			.string()
			.min(1, 'Email is required')
			.email('Please enter a valid email address'),
		password: z
			.string()
			.min(1, 'Password is required')
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain at least one uppercase letter, one lowercase letter, and one number'
			),
		passwordConfirmation: z.string().min(1, 'Please confirm your password'),
	})
	.refine((data) => data.password === data.passwordConfirmation, {
		message: 'Passwords do not match',
		path: ['passwordConfirmation'],
	});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

// Sign in validation schema
export const signInSchema = z.object({
	email: z
		.string()
		.min(1, 'Email is required')
		.email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required'),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

// Password reset request schema
export const passwordResetRequestSchema = z.object({
	email: z
		.string()
		.min(1, 'Email is required')
		.email('Please enter a valid email address'),
});

export type PasswordResetRequestFormValues = z.infer<
	typeof passwordResetRequestSchema
>;

// Password reset schema
export const passwordResetSchema = z
	.object({
		password: z
			.string()
			.min(1, 'Password is required')
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain at least one uppercase letter, one lowercase letter, and one number'
			),
		passwordConfirmation: z.string().min(1, 'Please confirm your password'),
	})
	.refine((data) => data.password === data.passwordConfirmation, {
		message: 'Passwords do not match',
		path: ['passwordConfirmation'],
	});

export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

// Profile update schema
export const profileUpdateSchema = z.object({
	displayName: z
		.string()
		.min(2, 'Display name must be at least 2 characters')
		.max(50, 'Display name must be less than 50 characters'),
	location: z.string().max(100, 'Location must be less than 100 characters'),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

export const uploadImageSchema = z.object({
	image: z
		.instanceof(File)
		.refine((file) => file.size <= 5 * 1024 * 1024, {
			message: 'Image must be less than 5MB',
		})
		.refine((file) => file.type.startsWith('image/'), {
			message: 'File must be an image',
		}),
});

export type UploadImageFormValues = z.infer<typeof uploadImageSchema>;

// Change password schema
export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z
			.string()
			.min(1, 'New password is required')
			.min(8, 'Password must be at least 8 characters')
			.max(128, 'Password must be less than 128 characters')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain at least one uppercase letter, one lowercase letter, and one number'
			),
		confirmPassword: z.string().min(1, 'Please confirm your password'),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// Profile name update schema
export const profileNameSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.min(2, 'Name must be at least 2 characters')
		.max(100, 'Name must be less than 100 characters')
		.regex(
			/^[\p{L}\s'-]+$/u,
			'Name can only contain letters, spaces, hyphens, and apostrophes'
		),
});

export type ProfileNameFormValues = z.infer<typeof profileNameSchema>;

// Change email schema
export const changeEmailSchema = z.object({
	newEmail: z
		.string()
		.min(1, 'Email is required')
		.email('Please enter a valid email address'),
});

export type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;
