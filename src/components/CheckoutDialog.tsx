import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore, CartItem } from "@/stores/cartStore";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CheckoutDialog = ({ open, onOpenChange }: CheckoutDialogProps) => {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPurchaseComplete, setIsPurchaseComplete] = useState(false);

  const totalPrice = items.reduce(
    (sum, item) => sum + parseFloat(item.price.amount) * item.quantity,
    0
  );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsProcessing(true);

    // Simulate purchase processing (1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsProcessing(false);
    setIsPurchaseComplete(true);

    // Show purchase complete message then redirect to voice review
    setTimeout(() => {
      clearCart();
      onOpenChange(false);
      toast.success('Purchase complete! Please leave a voice review.', {
        duration: 5000,
      });
      
      // Pass all products as query parameter
      const products = items.map(item => ({
        name: item.product.node.title,
        price: item.price.amount,
      }));
      navigate(`/gemini-live?products=${encodeURIComponent(JSON.stringify(products))}`);
    }, 2000);
  };

  const resetDialog = () => {
    setEmail("");
    setIsProcessing(false);
    setIsPurchaseComplete(false);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) {
          setTimeout(resetDialog, 300);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {!isPurchaseComplete ? (
          <>
            <DialogHeader>
              <DialogTitle>Enter Order Information</DialogTitle>
              <DialogDescription>
                You can leave a voice review after purchase
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="space-y-4">
                <div className="bg-secondary/20 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Order Summary</h4>
                  {items.map((item) => (
                    <div key={item.variantId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product.node.title} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        ${(parseFloat(item.price.amount) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address to receive purchase confirmation and voice review link
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isProcessing || !email}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay $${totalPrice.toFixed(2)}`
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Purchase Complete!</h3>
              <p className="text-muted-foreground">
                Redirecting to voice review page...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
