import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

// Fonction de désinfection simple pour éviter les injections de code de base
const sanitizeInput = (input: string) => {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    gdprConsent: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : sanitizeInput(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdprConsent) {
      toast.error("Veuillez accepter la politique de confidentialité pour envoyer votre message.");
      return;
    }
    // Ici, vous enverriez les données du formulaire à votre backend
    // N'oubliez pas que la validation et la désinfection côté serveur sont cruciales pour la sécurité.
    console.log('Formulaire soumis:', formData);
    toast.success("Votre message a été envoyé avec succès !");
    setFormData({
      name: '',
      email: '',
      message: '',
      gdprConsent: false,
    });
  };

  return (
    <div className="container mx-auto p-8 pt-24">
      <h1 className="text-4xl font-bold mb-6 text-center">Contactez-nous</h1>
      <p className="text-center mb-8 text-gray-700">Vous avez des questions ou des suggestions ? N'hésitez pas à nous envoyer un message.</p>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4">
          <Label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nom</Label>
          <Input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</Label>
          <Input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-6">
          <Label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">Message</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-6 flex items-center">
          <Checkbox
            id="gdprConsent"
            checked={formData.gdprConsent}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, gdprConsent: checked as boolean }))}
            className="mr-2"
          />
          <Label htmlFor="gdprConsent" className="text-sm text-gray-700">
            J'accepte que mes données soient utilisées conformément à la <a href="/politique-confidentialite" className="text-blue-500 hover:underline">Politique de Confidentialité</a>.
          </Label>
        </div>
        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          Envoyer le message
        </Button>
      </form>
    </div>
  );
}

export default Contact;
