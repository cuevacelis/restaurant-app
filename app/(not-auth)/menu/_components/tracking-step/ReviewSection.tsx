import { Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReviewSectionProps {
  orderStatus?: string;
  hasReviewed: boolean;
  submitted: boolean;
  rating: number;
  comment: string;
  submitting: boolean;
  onRatingChange: (r: number) => void;
  onCommentChange: (c: string) => void;
  onSubmit: () => void;
}

export function ReviewSection({
  orderStatus,
  hasReviewed,
  submitted,
  rating,
  comment,
  submitting,
  onRatingChange,
  onCommentChange,
  onSubmit,
}: ReviewSectionProps) {
  if (submitted || (orderStatus === "paid" && hasReviewed)) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
          <p className="font-semibold">¡Gracias por tu visita!</p>
          <p className="text-sm text-muted-foreground mt-1">Esperamos verte pronto</p>
        </CardContent>
      </Card>
    );
  }

  if (orderStatus !== "paid") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">¿Cómo fue tu experiencia?</CardTitle>
        <p className="text-sm text-muted-foreground">Calificación opcional</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => onRatingChange(star)}>
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Cuéntanos tu experiencia... (opcional)"
          rows={3}
        />
        <Button className="w-full" onClick={onSubmit} disabled={!rating || submitting}>
          {submitting ? "Enviando..." : "Enviar calificación"}
        </Button>
      </CardContent>
    </Card>
  );
}
