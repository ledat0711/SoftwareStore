import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// import * as Sentry from "@sentry/nextjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToPlainObject<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

export function formatNumberWithDecimal(num: number): string {
    const [int, decimal] = num.toString().split('.');
    return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatError(error: any): string {
    if (error.name === 'ZodError') {
        // Handle Zod validation errors 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldErrors = error.errors.map((err: any) => err.message);
        return fieldErrors.join('. ');
    } else if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2002') {
        // Handle Prisma unique constraint violation errors
        const field = error.meta?.target ? error.meta.target[0] : 'Field';
        return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    } else if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2025') {
        // Handle Prisma "Record not found" errors
        const cause = error.meta?.cause || 'Record';
        return `${cause.charAt(0).toUpperCase() + cause.slice(1)} not found`;
    } else if (error.name === 'PrismaClientInitializationError') {
        // Handle Prisma database connection errors
        return 'Database connection failed. Please check your database configuration.';
    } else if (error.isAxiosError) {
        // Handle Axios HTTP request errors
        return `HTTP Request Failed: ${error.response?.data?.message || error.message}`;
    } else if (error instanceof Error) {
        // Handle generic JavaScript/TypeScript errors
        return error.message;
    } else {
        // Handle unknown errors
        return typeof error.message === 'string'
            ? error.message
            : JSON.stringify(error);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleError(error: any): string {
    const formattedErrorMessage = formatError(error);
    if (process.env.NODE_ENV === 'production') {
        // Sentry.captureException(error);
        console.error('Error in Prod mode:', error);
    } else {
        console.error('Error in development mode:', error);
    }
    return formattedErrorMessage;
}


// round number upto 2 decimal places
export function round2(value: number | string) {
    if (typeof value === 'number') {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    } else if (typeof value === 'string') { 
        return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
    } else {
        throw new Error('Value is not a number or string');
    }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
    minimumFractionDigits: 2
});

export function formatCurrency(amount: number | string | null) {
    if (typeof amount === 'number') {
        return CURRENCY_FORMATTER.format(amount);
    } if (typeof amount === 'string') {
        return CURRENCY_FORMATTER.format(Number(amount));
    } else {
        return 'NaN';
    }
}

// short UUID
export function formatId(id: string) {
    return `${id.substring(id.length - 6)}`
}

// Format date and times
export const formatDateTime = (dateString: Date) => {
    const dateTimeOptions: Intl.DateTimeFormatOptions = {
        month: 'short', // abbreviated month name (e.g., 'Oct')
        year: 'numeric', // abbreviated month name (e.g., 'Oct')
        day: 'numeric', // numeric day of the month (e.g., '25')
        hour: 'numeric', // numeric hour (e.g., '8')
        minute: 'numeric', // numeric minute (e.g., '30')
        hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
    };
    const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
        month: 'short', // abbreviated month name (e.g., 'Oct')
        year: 'numeric', // numeric year (e.g., '2023')
        day: 'numeric', // numeric day of the month (e.g., '25')
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric', // numeric hour (e.g., '8')
        minute: 'numeric', // numeric minute (e.g., '30')
        hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
    };
    const formattedDateTime: string = new Date(dateString).toLocaleString(
        'en-US',
        dateTimeOptions
    );
    const formattedDate: string = new Date(dateString).toLocaleString(
        'en-US',
        dateOptions
    );
    const formattedTime: string = new Date(dateString).toLocaleString(
        'en-US',
        timeOptions
    );
    return {
        dateTime: formattedDateTime,
        dateOnly: formattedDate,
        timeOnly: formattedTime,
    };
};