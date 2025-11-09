import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MessageSquare, BarChart3, Brain, Sparkles, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Voice-First Reviews",
      description: "Customers share feedback naturally through voice, creating authentic and detailed reviews"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI extracts insights, sentiment, and actionable feedback automatically"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-Time Dashboard",
      description: "Monitor customer satisfaction and trends with intelligent analytics"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Natural Language Search",
      description: "Ask questions about your reviews in plain English and get instant insights"
    }
  ];

  const benefits = [
    "Increase review completion rates by 3x",
    "Get richer, more detailed feedback",
    "Reduce negative reviews with early insights",
    "Improve products based on real voice of customer",
    "Save hours on manual review analysis"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">HacknationAI</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <div className="p-4 rounded-2xl gradient-primary shadow-glow mb-6">
              <Mic className="w-16 h-16 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Voice CRM Agent for Customer Experience & Reviews
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Transform customer feedback with AI-powered voice reviews. 
            Collect authentic insights, boost engagement, and make data-driven decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              className="text-lg px-12 py-7 gradient-primary shadow-glow hover:opacity-90 transition-all text-lg font-semibold"
              onClick={() => navigate("/purchase")}
            >
              <Sparkles className="mr-2 h-6 w-6" />
              Try Our Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Experience a real customer review flow in under 2 minutes
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Voice Reviews?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-6 space-y-4 shadow-card hover:shadow-glow transition-all">
                <div className="p-3 rounded-xl bg-primary/10 w-fit text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 shadow-card">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Drive Real Business Results
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center">
            Simple 3-Step Process
          </h2>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow">
                1
              </div>
              <div className="pt-2">
                <h3 className="text-xl md:text-2xl font-semibold mb-2">
                  Customer Completes Purchase
                </h3>
                <p className="text-muted-foreground text-lg">
                  After checkout, customers receive a friendly prompt to share their experience
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow">
                2
              </div>
              <div className="pt-2">
                <h3 className="text-xl md:text-2xl font-semibold mb-2">
                  AI Conducts Voice Interview
                </h3>
                <p className="text-muted-foreground text-lg">
                  Natural conversation with intelligent follow-up questions in real-time
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow">
                3
              </div>
              <div className="pt-2">
                <h3 className="text-xl md:text-2xl font-semibold mb-2">
                  Get Actionable Insights
                </h3>
                <p className="text-muted-foreground text-lg">
                  View structured feedback, sentiment analysis, and trends in your dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 pb-32">
        <Card className="max-w-4xl mx-auto p-10 md:p-16 text-center space-y-6 gradient-primary shadow-glow">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground">
            Ready to Elevate Customer Experience?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Experience the future of customer feedback with our interactive demo
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-12 py-7 mt-6 text-lg font-semibold shadow-elegant"
            onClick={() => navigate("/purchase")}
          >
            <Mic className="mr-2 h-6 w-6" />
            Start Demo Now
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default Landing;
