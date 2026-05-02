import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Building, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { usePageContent } from '@/hooks/usePageContent';
import { apiUrl } from '@/lib/api';

export default function Contact() {
  const { getTitle, getText } = usePageContent('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl('/api/public/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
        setFormData({
          name: '',
          email: '',
          organization: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error('Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi du message. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactInfo = [
    {
      title: 'Siège Social',
      icon: Building,
      details: [
        'Avenue des Cliniques',
        'Kinshasa, République Démocratique du Congo',
        'BP 12345 Kinshasa I'
      ]
    },
    {
      title: 'Téléphones',
      icon: Phone,
      details: [
        '+243 81 234 5678 (Direction)',
        '+243 99 876 5432 (Urgences)',
        '+243 81 PAIDE (72433) (Ligne dédiée)'
      ]
    },
    {
      title: 'Emails',
      icon: Mail,
      details: [
        'info@paide.cd (Général)',
        'direction@paide.cd (Direction)',
        'urgence@paide.cd (Urgences)'
      ]
    },
    {
      title: 'Horaires',
      icon: Clock,
      details: [
        'Lundi - Vendredi: 8h00 - 17h00',
        'Samedi: 8h00 - 12h00',
        'Urgences: 24h/24, 7j/7'
      ]
    }
  ];

  const bureaux = [
    {
      ville: 'Kinshasa',
      adresse: 'Avenue des Cliniques, Gombe',
      telephone: '+243 81 234 5678',
      email: 'kinshasa@paide.cd',
      type: 'Siège Social'
    },
    {
      ville: 'Lubumbashi',
      adresse: 'Avenue Mobutu, Haut-Katanga',
      telephone: '+243 97 123 4567',
      email: 'lubumbashi@paide.cd',
      type: 'Bureau Provincial'
    },
    {
      ville: 'Goma',
      adresse: 'Avenue du Lac, Nord-Kivu',
      telephone: '+243 82 765 4321',
      email: 'goma@paide.cd',
      type: 'Bureau Provincial'
    },
    {
      ville: 'Bukavu',
      adresse: 'Avenue Patrice Lumumba, Sud-Kivu',
      telephone: '+243 99 888 7777',
      email: 'bukavu@paide.cd',
      type: 'Bureau Provincial'
    },
    {
      ville: 'Kananga',
      adresse: 'Quartier Katoka, Kasaï',
      telephone: '+243 81 555 4444',
      email: 'kananga@paide.cd',
      type: 'Bureau Provincial'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {getTitle('hero', 'Contactez-nous')}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-4xl mx-auto">
              {getText('hero', 'Nous sommes à votre écoute. Que vous souhaitiez signaler un enfant en détresse, devenir partenaire ou simplement en savoir plus sur nos programmes, n\'hésitez pas à nous contacter.')}
            </p>
          </div>
        </div>
      </section>

      {/* Informations de Contact */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('coordonnees', 'Nos Coordonnées')}</h2>
            <p className="text-gray-600 text-lg">
              {getText('coordonnees', 'Plusieurs moyens pour nous joindre selon vos besoins')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="card-official text-center h-full">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <info.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {info.details.map((detail, i) => (
                      <p key={i} className="text-gray-600 text-sm">
                        {detail}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire de Contact */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold text-dark mb-6">{getTitle('formulaire', 'Envoyez-nous un Message')}</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {getText('formulaire', 'Utilisez le formulaire ci-contre pour nous envoyer votre message. Nous nous engageons à répondre dans les 24 heures pour les demandes générales et immédiatement pour les urgences.')}
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark mb-1">Urgences</h3>
                    <p className="text-gray-600 text-sm">
                      Pour signaler un enfant en danger, utilisez notre ligne d'urgence 
                      ou sélectionnez "Urgence" dans le formulaire.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark mb-1">Partenariats</h3>
                    <p className="text-gray-600 text-sm">
                      Intéressé par un partenariat ? Décrivez votre organisation 
                      et vos propositions de collaboration.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark mb-1">Informations</h3>
                    <p className="text-gray-600 text-sm">
                      Questions sur nos programmes, demandes d'information ou 
                      suggestions d'amélioration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Card className="card-official">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="w-5 h-5 mr-2 text-primary" />
                  Formulaire de Contact
                </CardTitle>
                <CardDescription>
                  Tous les champs sont obligatoires
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Votre nom complet"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Adresse email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="votre.email@exemple.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="organization">Organisation</Label>
                    <Input
                      id="organization"
                      type="text"
                      value={formData.organization}
                      onChange={(e) => handleChange('organization', e.target.value)}
                      placeholder="Nom de votre organisation (optionnel)"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Type de demande *</Label>
                    <Select onValueChange={(value) => handleChange('subject', value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type de votre demande" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgence">🚨 Urgence - Enfant en danger</SelectItem>
                        <SelectItem value="information">ℹ️ Demande d'information</SelectItem>
                        <SelectItem value="partenariat">🤝 Proposition de partenariat</SelectItem>
                        <SelectItem value="stage">🎓 Demande de stage</SelectItem>
                        <SelectItem value="emploi">💼 Candidature spontanée</SelectItem>
                        <SelectItem value="media">📰 Demande média/presse</SelectItem>
                        <SelectItem value="autre">📝 Autre demande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      placeholder="Décrivez votre demande de manière détaillée..."
                      rows={5}
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="btn-primary-official w-full text-lg py-3"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    En soumettant ce formulaire, vous acceptez que vos données soient utilisées 
                    pour répondre à votre demande conformément à notre politique de confidentialité.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bureaux Provinciaux */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('bureaux', 'Nos Bureaux')}</h2>
            <p className="text-gray-600 text-lg">
              {getText('bureaux', 'Retrouvez-nous dans les principales villes de la RDC')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bureaux.map((bureau, index) => (
              <Card key={index} className="card-official">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{bureau.ville}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      bureau.type === 'Siège Social' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-secondary/10 text-secondary'
                    }`}>
                      {bureau.type}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">{bureau.adresse}</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-gray-600 text-sm">{bureau.telephone}</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-gray-600 text-sm">{bureau.email}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section Urgences */}
      <section className="py-16 bg-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Phone className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-red-800 mb-6">{getTitle('urgences', 'Urgences')}</h2>
          <p className="text-red-700 text-lg mb-8">
            {getText('urgences', 'Si vous connaissez un enfant en situation de danger immédiat, contactez-nous immédiatement via nos lignes d\'urgence.')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center justify-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Ligne d'urgence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600 mb-2">+243 81 PAIDE</p>
                <p className="text-red-700 text-sm">(+243 81 72433)</p>
                <p className="text-red-600 text-sm mt-2">24h/24 - 7j/7</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center justify-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Email urgence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-red-600 mb-2">urgence@paide.cd</p>
                <p className="text-red-600 text-sm">Réponse immédiate</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center justify-center">
                  <Building className="w-5 h-5 mr-2" />
                  Centre le plus proche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-red-600 mb-2">45 centres</p>
                <p className="text-red-600 text-sm">Accueil sans rendez-vous</p>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-red-600 text-sm">
            Toute information est traitée avec la plus stricte confidentialité
          </p>
        </div>
      </section>
    </div>
  );
}