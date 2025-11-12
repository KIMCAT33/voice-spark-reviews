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
      toast.error('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    setIsProcessing(true);

    // 구매 처리 시뮬레이션 (1.5초)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsProcessing(false);
    setIsPurchaseComplete(true);

    // 구매 완료 메시지 표시 후 음성 리뷰로 이동
    setTimeout(() => {
      clearCart();
      onOpenChange(false);
      toast.success('구매가 완료되었습니다! 음성으로 리뷰를 남겨주세요.', {
        duration: 5000,
      });
      
      // 제품 정보를 쿼리 파라미터로 전달
      const productName = items[0]?.product.node.title || 'VOIX Beauty 제품';
      navigate(`/gemini-live?product=${encodeURIComponent(productName)}`);
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
              <DialogTitle>주문 정보 입력</DialogTitle>
              <DialogDescription>
                구매 완료 후 음성 리뷰를 남기실 수 있습니다
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="space-y-4">
                <div className="bg-secondary/20 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">주문 요약</h4>
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
                    <span className="font-semibold">총액</span>
                    <span className="font-bold text-primary">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일 주소</Label>
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
                    구매 확인 및 음성 리뷰 링크를 받으실 이메일 주소입니다
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
                    결제 처리 중...
                  </>
                ) : (
                  `${totalPrice.toFixed(2)} 결제하기`
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
              <h3 className="text-2xl font-bold">구매 완료!</h3>
              <p className="text-muted-foreground">
                곧 음성 리뷰 페이지로 이동합니다...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
