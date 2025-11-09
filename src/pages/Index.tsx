import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MessageSquare, TrendingUp, Zap } from "lucide-react";
import VoiceReview from "@/components/VoiceReview";

const Index = () => {
  const [showVoiceReview, setShowVoiceReview] = useState(false);

  if (showVoiceReview) {
    return <VoiceReview onBack={() => setShowVoiceReview(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block mb-4">
            <div className="p-4 rounded-2xl gradient-primary shadow-glow">
              <Mic className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Voice Review Agent
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Replace boring text reviews with natural AI-powered voice conversations. 
            Your customers talk, we listen, and you get actionable insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 gradient-primary shadow-glow hover:opacity-90 transition-all"
              onClick={() => setShowVoiceReview(true)}
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Voice Review
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 space-y-4 shadow-card hover:shadow-glow transition-all">
            <div className="p-3 rounded-xl bg-primary/10 w-fit">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">Natural Conversations</h3>
            <p className="text-muted-foreground">
              Our AI clerk conducts friendly, natural conversations that feel like talking to a real person, not filling out a form.
            </p>
          </Card>

          <Card className="p-8 space-y-4 shadow-card hover:shadow-glow transition-all">
            <div className="p-3 rounded-xl bg-accent/10 w-fit">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-2xl font-semibold">Actionable Insights</h3>
            <p className="text-muted-foreground">
              Automatically extract structured data, sentiment analysis, and improvement suggestions from every conversation.
            </p>
          </Card>

          <Card className="p-8 space-y-4 shadow-card hover:shadow-glow transition-all">
            <div className="p-3 rounded-xl bg-secondary/10 w-fit">
              <Zap className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-2xl font-semibold">Instant Setup</h3>
            <p className="text-muted-foreground">
              No complex integration needed. Send a review link and start collecting voice feedback in seconds.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="text-4xl font-bold text-center">How It Works</h2>
          
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Customer receives review link</h3>
                <p className="text-muted-foreground">
                  Send an automated link after purchase or service completion
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full gradient-accent flex items-center justify-center text-accent-foreground font-bold text-lg shadow-glow">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI conducts voice interview</h3>
                <p className="text-muted-foreground">
                  Natural conversation with dynamic follow-up questions
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get structured insights</h3>
                <p className="text-muted-foreground">
                  Receive formatted feedback ready for your CRM or analytics platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto p-12 text-center space-y-6 gradient-primary shadow-glow">
          <h2 className="text-4xl font-bold text-primary-foreground">
            Ready to Transform Your Reviews?
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Start collecting authentic voice feedback that actually helps you improve your products.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6 mt-4"
            onClick={() => setShowVoiceReview(true)}
          >
            <Mic className="mr-2 h-5 w-5" />
            Try It Now
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default Index;
