export interface PinVerifyRequestDto {
    cardNumber: string;
    pin: string;
}

export interface PinResult {
    success: boolean;
    message: string;
    token?: string;
    cardId?: number;
    isBlocked?: boolean;
    remainingAttempts?: number;
}

export interface AccountResponseDto {
    id: number;
    accountNumber: string;
    balance: number;
}

export interface WithdrawRequestDto {
    accountId: number;
    atmId: number;
    amount: number;
}

export interface WithdrawResult {
    success: boolean;
    message: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
}

export interface DepositRequestDto {
    accountId: number;
    atmId: number;
    amount: number;
}

export interface DepositResult {
    success: boolean;
    message: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
}

export interface TransferRequestDto {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    atmId: number;
}

export interface TransferResult {
    success: boolean;
    message: string;
    amount: number;
    fromAccountBalanceAfter: number;
}

export interface TransactionResponseDto {
    id: number;
    amount: number;
    type: string;
    balanceBefore: number;
    balanceAfter: number;
    status: string;
    failReason?: string;
    createdAt: Date;
    accountNumber: string;
    ownerName: string;
}
