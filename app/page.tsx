import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

export default function Home() {
  // This ensures server-side redirect to login page
  redirect("/login");

  // The code below will never execute due to the redirect above
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Daster Bordir Cantik
          </CardTitle>
          <CardDescription className="text-center">
            Point of Sale System
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Image
            src="/placeholder.svg"
            alt="Daster Bordir Cantik Logo"
            width={200}
            height={200}
            className="rounded-md"
          />
          <Button className="w-full bg-violet-500 hover:bg-violet-600">
            Login to Continue
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
