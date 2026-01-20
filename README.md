# 🎂 Beni Tanıyor musun? - Doğum Günü Quiz

Kahoot benzeri gerçek zamanlı çok oyunculu doğum günü quiz oyunu.

## Özellikler

- 🎮 Gerçek zamanlı çok oyuncu desteği
- 📱 Mobil-öncelikli tasarım
- ⏱️ Hız bazlı puanlama
- 🏆 Animasyonlu liderlik tablosu
- 🎉 Konfeti efektli final ekranı

## Kurulum

### Server
```bash
cd server
npm install
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

## Deployment

Render.com üzerinde deploy için `DEPLOY.md` dosyasına bakın.

## Sorular

`server/src/questions.ts` dosyasını düzenleyerek kendi sorularınızı ekleyin.

## Teknolojiler

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + Socket.io
- Styling: Vanilla CSS (Kahoot renk teması)
