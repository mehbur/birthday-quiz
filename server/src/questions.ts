// =====================================================
// DOĞUM GÜNÜ BİLMECESİ - SORULAR
// =====================================================
// Bu dosyayı düzenleyerek kendi sorularınızı ekleyin!
// Her soru için:
//   - text: Soru metni
//   - options: Cevap seçenekleri (2-4 arası)
//   - correctIndex: Doğru cevabın indeksi (0'dan başlar)
//   - timeLimit: Süre (saniye, varsayılan: 20)
//   - points: Maksimum puan (varsayılan: 1000)
// =====================================================

import { Question } from './types.js';

export const questions: Question[] = [
    {
        id: '1',
        text: 'Benim en sevdiğim renk hangisi?',
        options: ['Lacivert', 'Kırmızı', 'Yeşil', 'Mor'],
        correctIndex: 0,
        timeLimit: 20,
        points: 1000,
    },
    {
        id: '2',
        text: 'Hangi şehirde doğdum?',
        options: ['İstanbul', 'Sakarya', 'Mersin', 'Siirt'],
        correctIndex: 1,
        timeLimit: 20,
        points: 1000,
    },
    {
        id: '3',
        text: 'En sevdiğim yemek hangisi?',
        options: ['Pizza', 'Lahmacun', 'Tavuk Döner', 'Mantı'],
        correctIndex: 2,
        timeLimit: 20,
        points: 1000,
    },
    {
        id: '4',
        text: 'Kaç yaşına girdim?',
        options: ['20', '21', '22', '23'],
        correctIndex: 3,
        timeLimit: 15,
        points: 1000,
    },
    {
        id: '5',
        text: 'Hayalimdeki tatil yeri neresi?',
        options: ['Paris', 'Tokyo', 'New York', 'Bali'],
        correctIndex: 3,
        timeLimit: 20,
        points: 1000,
    },
    {
        id: '6',
        text: 'Benim için bir tatil günü ideal olarak nasıl geçer?',
        options: ['Evde film + oyun', 'Bütün gün uyumak', ' Uzun bir yürüyüş / dışarı çıkma', 'Ders Çalışarak'],
        correctIndex: 0,
        timeLimit: 30,
        points: 1000,
    },
    {
        id: '6',
        text: 'En sevdiğim kahve?',
        options: ['Latte', 'Filtre kahve', 'Türk kahvesi', 'Espresso'],
        correctIndex: 1,
        timeLimit: 30,
        points: 1000
    },
    {
        id: '7',
        text: 'Bir ortamda beni genelde hangi rolde görürsünüz?',
        options: ['Sessiz gözlemci', 'Ortamı yönlendiren', 'Telefonla uğraşan', 'Tek kişiyle derin muhabbette'],
        correctIndex: 0,
        timeLimit: 30,
        points: 1000
    },
    {
        id: '8',
        text: 'Bir karar verirken en çok hangisine güvenirim?',
        options: ['Hisler', 'Deneyimler', 'Mantık', 'Başkalarının fikirleri'],
        correctIndex: 2,
        timeLimit: 30,
        points: 1000
    },
    {
        id: '9',
        text: 'Bir plan yaparken genelde nasılımdır?',
        options: ['Aşırı detaycı', 'Esnek ama kontrollü', 'Son ana bırakan', 'Plansız'],
        correctIndex: 1,
        timeLimit: 30,
        points: 1000
    },
    {
        id: '10',
        text: 'Beni en iyi tanıyan biri hangisini söyler?',
        options: ['Çok sabırlıdır', 'Her şeyi sorgular', 'Hemen sinirlenir', 'Aşırı rahattır'],
        correctIndex: 0,
        timeLimit: 30,
        points: 1000
    },
    {
        id: '11',
        text: 'Mersine kaç yaşında taşındım?',
        options: ['15', '16', '17', '18'],
        correctIndex: 1,
        timeLimit: 30,
        points: 1000
    },
    {
        id: '12',
        text: 'Kardeşimin ismi ne?',
        options: ['Fatma', 'Elif', 'İrem', 'Zeynep',],
        correctIndex: 3,
        timeLimit: 30,
        points: 1000
    },
    {
        id: '13',
        text: 'Annemle babam ne iş yapıyor?',
        options: ['Öğretmen', 'Esnaf', 'Emekli', '',],
        correctIndex: 3,
        timeLimit: 30,
        points: 1000
    },
    {
        id: '14',
        text: 'En sık kullandığım uygulama hangisi?',
        options: ['Instagram', 'TikTok', 'WhatsApp', 'Spotify'],
        correctIndex: 2,
        timeLimit: 20,
        points: 1000
    },
    {
        id: '15',
        text: 'Dünyanın en güzel kızı kim?',
        options: ['Pelin', '-', '-', '-'],
        correctIndex: 0,
        timeLimit: 20,
        points: 1000
    },
];
