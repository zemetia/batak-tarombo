import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function DonationPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl font-headline">Support the Project</CardTitle>
                <CardDescription>
                  Your contribution helps us maintain and grow this important cultural resource.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              The Batak Lineage project is a labor of love, dedicated to preserving our shared heritage. Maintaining the website, managing the data, and developing new features requires time and resources.
            </p>
            <p>
              If you find this project valuable, please consider making a donation. Your support, no matter the size, makes a real difference. It helps cover server costs, development time, and data verification efforts.
            </p>
            <p>
              Thank you for being a part of this community and for helping us keep the story of the Batak people alive for future generations.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <Button size="lg">
                <Heart className="mr-2 h-5 w-5" />
                Donate Now
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
