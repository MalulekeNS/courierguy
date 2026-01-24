import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  buttonText: string;
}

const FeatureCard = ({ title, description, icon: Icon, link, buttonText }: FeatureCardProps) => {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-accent/10 transition-transform group-hover:scale-150" />
      <CardHeader className="relative">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <Link to={link}>
          <Button variant="accent" className="group/btn gap-2">
            {buttonText}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
