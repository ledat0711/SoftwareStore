type PaypalButtonsComponent = {
  render: (container: HTMLElement | string) => Promise<void>;
  close: () => void;
};

type PaypalButtons = (options: {
  style?: Record<string, unknown>;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void> | void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
}) => PaypalButtonsComponent;

type PaypalNamespace = {
  Buttons: PaypalButtons;
};

declare global {
  interface Window {
    paypal?: PaypalNamespace;
  }
}

export {};
