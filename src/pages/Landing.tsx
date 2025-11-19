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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted overflow-x-hidden">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg md:text-xl font-bold">VOIX</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/shop")}
            className="text-sm sm:text-base"
          >
            Shop
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 lg:py-24 xl:py-32">
        <div className="max-w-5xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8">
          <div className="inline-block animate-fade-in">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl gradient-primary shadow-glow mb-3 sm:mb-4 md:mb-6">
              <Mic className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight px-2 animate-fade-in break-words">
            VOIX: Voice-First CRM Agent for Customer Experience
          </h1>
          
          <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto px-2 sm:px-4 animate-fade-in leading-relaxed">
            Transform customer feedback with AI-powered voice reviews. 
            Collect authentic insights, boost engagement, and make data-driven decisions.
          </p>

          <div className="flex flex-col gap-3 justify-center pt-2 sm:pt-4 md:pt-6 lg:pt-8 px-2 sm:px-4 animate-fade-in">
            {/* Primary CTA - Quick Demo */}
            <Button 
              size="lg" 
              className="w-full sm:w-auto mx-auto text-sm xs:text-base sm:text-lg px-6 xs:px-8 sm:px-10 md:px-12 py-5 xs:py-6 sm:py-7 gradient-primary shadow-glow hover:opacity-90 transition-all font-semibold"
              onClick={() => navigate("/purchase")}
            >
              <Sparkles className="mr-2 h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
              Quick Demo (2-3 min)
            </Button>
            
            {/* Secondary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-sm xs:text-base sm:text-lg px-6 xs:px-8 sm:px-10 md:px-12 py-5 xs:py-6 sm:py-7 font-semibold border-2"
                onClick={() => navigate("/shop")}
              >
                Full Experience (5-7 min)
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-sm xs:text-base sm:text-lg px-6 xs:px-8 sm:px-10 md:px-12 py-5 xs:py-6 sm:py-7 font-semibold border-2"
                onClick={() => navigate("/dashboard")}
              >
                <BarChart3 className="mr-2 h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                View Dashboard
              </Button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground px-2 sm:px-4 animate-fade-in text-center">
            Choose your demo experience above
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-3 xs:px-4 sm:px-6 py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 px-2 sm:px-4 break-words">
            Why Choose Voice Reviews?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-4 xs:p-5 sm:p-6 space-y-2.5 xs:space-y-3 sm:space-y-4 shadow-card hover:shadow-glow transition-all hover-scale">
                <div className="p-2 xs:p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 w-fit text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-base xs:text-lg sm:text-xl font-semibold break-words">{feature.title}</h3>
                <p className="text-muted-foreground text-xs xs:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-3 xs:px-4 sm:px-6 py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="p-5 xs:p-6 sm:p-8 md:p-10 lg:p-12 shadow-card">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-5 xs:mb-6 sm:mb-8 px-2 break-words">
              Drive Real Business Results
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2.5 xs:gap-3">
                  <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                    <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="text-sm xs:text-base sm:text-lg leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-3 xs:px-4 sm:px-6 py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto space-y-6 xs:space-y-8 sm:space-y-10 md:space-y-12">
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center px-2 sm:px-4 break-words">
            Simple 3-Step Process
          </h2>
          
          <div className="space-y-5 xs:space-y-6 sm:space-y-8 px-2">
            <div className="flex gap-3 xs:gap-4 sm:gap-5 md:gap-6 items-start">
              <div className="flex-shrink-0 w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm xs:text-base sm:text-lg shadow-glow">
                1
              </div>
              <div className="pt-0.5 xs:pt-1 sm:pt-2 flex-1 min-w-0">
                <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold mb-1 xs:mb-1.5 sm:mb-2 break-words">
                  Customer Completes Purchase
                </h3>
                <p className="text-muted-foreground text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed">
                  After checkout, customers receive a friendly prompt to share their experience
                </p>
              </div>
            </div>

            <div className="flex gap-3 xs:gap-4 sm:gap-5 md:gap-6 items-start">
              <div className="flex-shrink-0 w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm xs:text-base sm:text-lg shadow-glow">
                2
              </div>
              <div className="pt-0.5 xs:pt-1 sm:pt-2 flex-1 min-w-0">
                <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold mb-1 xs:mb-1.5 sm:mb-2 break-words">
                  AI Conducts Voice Interview
                </h3>
                <p className="text-muted-foreground text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed">
                  Natural conversation with intelligent follow-up questions in real-time
                </p>
              </div>
            </div>

            <div className="flex gap-3 xs:gap-4 sm:gap-5 md:gap-6 items-start">
              <div className="flex-shrink-0 w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm xs:text-base sm:text-lg shadow-glow">
                3
              </div>
              <div className="pt-0.5 xs:pt-1 sm:pt-2 flex-1 min-w-0">
                <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold mb-1 xs:mb-1.5 sm:mb-2 break-words">
                  Get Actionable Insights
                </h3>
                <p className="text-muted-foreground text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed">
                  View structured feedback, sentiment analysis, and trends in your dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-3 xs:px-4 sm:px-6 py-10 sm:py-12 md:py-16 lg:py-20 pb-12 sm:pb-16 md:pb-24 lg:pb-32">
        <Card className="max-w-4xl mx-auto p-6 xs:p-8 sm:p-10 md:p-12 lg:p-16 text-center space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 gradient-primary shadow-glow">
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground px-2 break-words leading-tight">
            Ready to Elevate Customer Experience?
          </h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
            Experience the future of customer feedback with our interactive demo
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="w-full sm:w-auto text-sm xs:text-base sm:text-lg px-6 xs:px-8 sm:px-10 md:px-12 py-5 xs:py-6 sm:py-7 mt-1 xs:mt-2 sm:mt-4 md:mt-6 font-semibold shadow-elegant"
              onClick={() => navigate("/purchase")}
            >
              <Mic className="mr-2 h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
              Quick Demo (2-3 min)
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto text-sm xs:text-base sm:text-lg px-6 xs:px-8 sm:px-10 md:px-12 py-5 xs:py-6 sm:py-7 mt-1 xs:mt-2 sm:mt-4 md:mt-6 font-semibold border-2"
              onClick={() => navigate("/dashboard")}
            >
              <BarChart3 className="mr-2 h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
              View Dashboard
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Landing;
