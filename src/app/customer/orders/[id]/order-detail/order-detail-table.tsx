'use client';
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from 'next/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OrderItem } from "@prisma/client";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Loader } from "lucide-react";
import { approvePayPalOrder, createPayPalOrder } from "@/app/customer/action";
import { toast } from "sonner";

const PaypalLoadingState = () => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    if (isPending) {
        return (<>
            <div className="flex gap-2 justify-center text-center">
                <Loader className="w-4 h-4 animate-spin" /> Loading PayPal
            </div>
        </>)
    } else if (isRejected) {
        return (<div className="flex gap-2 justify-center text-center">
            Error while loading PayPal
        </div>)
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OrderDetailsTable = ({ order, payPalClientId }: { order: any, payPalClientId: string }) => {
    const { id,
        shippingAddress,
        orderitems,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        paymentMethod,
        isDelivered,
        isPaid,
        paidAt,
        deliveredAt
    } = order;

    const handleCreatePaypalOrder = async () => {
        const res = await createPayPalOrder(order.id);
        // show message
        if (!res.success) {
            toast.error(`${res.message}`);
            return;
        }

        return res.data;
    }

    const handleApprovePaypalOrder = async (data: { orderID: string }) => {
        const res = await approvePayPalOrder(order.id, data);
        // show message
        if (res.success) {
            toast.success(`${res.message}`);
            return;
        } else {
            toast.error(`${res.message}`);
            return;
        }
    }
    return (<>
        <h1 className="py-4 text-2xl font-bold">Order - {formatId(id)}</h1>
        <div className="grid md:grid-cols-3 md:gap-5">
            {/* left  */}
            <div className="md:col-span-2 overflow-x-auto space-y-4">
                <Card>
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Shipping Address</h2>
                        <p>{shippingAddress.fullName}</p>
                        <p>
                            {shippingAddress.streetAddress}, {shippingAddress.city} {' '}
                            {shippingAddress.postalCode}, {shippingAddress.country} {' '}
                        </p>
                        <div className="mt-3">
                            {isDelivered ? (
                                <Badge variant='secondary'>
                                    Delivered at {formatDateTime(deliveredAt!).dateTime}
                                </Badge>
                            ) : (
                                <Badge variant='destructive'>
                                    Not Delivered
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Payment Method</h2>
                        <p>{paymentMethod}</p>
                        <div className="mt-3">
                            {isPaid ? (
                                <Badge variant='secondary'>
                                    Paid at {formatDateTime(paidAt!).dateTime}
                                </Badge>
                            ) : (
                                <Badge variant='destructive'>
                                    Not paid
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Order Items</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-center">Quantity</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {/* right */}
            <div>
                <Card>
                    <CardContent className='p-4 gap-4 space-y-4'>
                        <div className='flex justify-between'>
                            <div>Items</div>
                            <div>{formatCurrency(itemsPrice)}</div>
                        </div>
                        <div className='flex justify-between'>
                            <div>Tax</div>
                            <div>{formatCurrency(taxPrice)}</div>
                        </div>
                        <div className='flex justify-between'>
                            <div>Shipping</div>
                            <div>{formatCurrency(shippingPrice)}</div>
                        </div>
                        <div className='flex justify-between'>
                            <div>Total</div>
                            <div>{formatCurrency(totalPrice)}</div>
                        </div>

                        {/* Paypal payment */}
                        {(!isPaid && paymentMethod === 'PayPal') && (
                            <div>
                                <PayPalScriptProvider options={{ clientId: payPalClientId }}>
                                    <PaypalLoadingState />
                                    <PayPalButtons
                                        createOrder={handleCreatePaypalOrder}
                                        onApprove={handleApprovePaypalOrder}
                                    />
                                </PayPalScriptProvider>
                            </div>
                        )}

                        {/* Stripe payment */}

                        {/* COD payment */}
                    </CardContent>
                </Card>
            </div>
        </div>
    </>);

}

export default OrderDetailsTable;