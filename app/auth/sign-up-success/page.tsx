"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">Sucesso!</CardTitle>
              <CardDescription>Sua conta foi criada com sucesso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-600">
                  Um email de confirmação foi enviado para você. Verifique sua caixa de entrada e confirme seu email
                  para ativar sua conta.
                </p>
                <Link href="/auth/login" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Voltar para Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
