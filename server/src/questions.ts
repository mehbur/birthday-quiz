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
        options: ['Mavi', 'Kırmızı', 'Yeşil', 'Mor'],
        correctIndex: 0,
        timeLimit: 20,
        points: 1000,
    },
    {
        id: '2',
        text: 'Hangi şehirde doğdum?',
        options: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'],
        correctIndex: 0,
        timeLimit: 20,
        points: 1000,
    },
    {
        id: '3',
        text: 'En sevdiğim yemek hangisi?',
        options: ['Pizza', 'Lahmacun', 'Döner', 'Mantı'],
        correctIndex: 1,
        timeLimit: 20,
        points: 1000,
    },
    {
        id: '4',
        text: 'Kaç yaşına girdim?',
        options: ['23', '24', '25', '26'],
        correctIndex: 2,
        timeLimit: 15,
        points: 1000,
    },
    {
        id: '5',
        text: 'Hayalimdeki tatil yeri neresi?',
        options: ['Paris', 'Tokyo', 'New York', 'Bali'],
        correctIndex: 1,
        timeLimit: 20,
        points: 1000,
    },
];
