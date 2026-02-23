type PaypalButtonsComponent = {
  render: (container: HTMLElement | string) => Promise<void>;
  close: () => void;
};

type PaypalButtonData = Record<string, unknown>;

type PaypalOnClickActions = {
  resolve: () => Promise<void> | void;
  reject: () => Promise<void> | void;
};

type PaypalButtonActions = Record<string, unknown>;

type PaypalButtons = (options: {
  style?: Record<string, unknown>;
  onClick?: (
    data: PaypalButtonData,
    actions: PaypalOnClickActions,
  ) => Promise<void> | void;
  createOrder: (
    data?: PaypalButtonData,
    actions?: PaypalButtonActions,
  ) => Promise<string> | string;
  onApprove: (
    data: { orderID?: string },
    actions?: PaypalButtonActions,
  ) => Promise<void> | void;
  onError?: (error: unknown) => void;
  onCancel?: (data?: PaypalButtonData) => void;
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
