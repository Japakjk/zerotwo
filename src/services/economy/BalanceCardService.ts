import { createCanvas, loadImage, registerFont } from 'canvas';
import { AttachmentBuilder } from 'discord.js';
import path from 'path';

export class BalanceCardService {
  static async generateCard(username: string, avatarURL: string, wallet: number, bank: number): Promise<AttachmentBuilder> {
    const width = 650;
    const height = 550;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fundo branco com cantos arredondados ou estilo clean
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Cartão central estilo Zany (Card branco com sombra sutil)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    const cardX = 50;
    const cardY = 40;
    const cardWidth = 550;
    const cardHeight = 470;
    const radius = 25;

    ctx.beginPath();
    ctx.moveTo(cardX + radius, cardY);
    ctx.lineTo(cardX + cardWidth - radius, cardY);
    ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + radius);
    ctx.lineTo(cardX + cardWidth, cardY + cardHeight - radius);
    ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - radius, cardY + cardHeight);
    ctx.lineTo(cardX + radius, cardY + cardHeight);
    ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - radius);
    ctx.lineTo(cardX, cardY + radius);
    ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Desenhar Avatar Circular no topo
    const avatarSize = 130;
    const avatarX = width / 2;
    const avatarY = 120;

    try {
      const avatar = await loadImage(avatarURL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();

      // Borda do avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ff3b69'; // Zero Two pink accent
      ctx.stroke();
      ctx.restore();
    } catch (e) {
      // Fallback se falhar ao carregar avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
      ctx.fillStyle = '#ff3b69';
      ctx.fill();
      ctx.restore();
    }

    // Nome de usuário
    ctx.fillStyle = '#2b2d31';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(username, width / 2, 215);

    // Função auxiliar para formatar números (ex: 169.56M ou abreviações)
    const formatNumber = (num: number) => {
      return num.toLocaleString();
    };

    const formatShort = (num: number) => {
      if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
      if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
      if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
      return num.toString();
    };

    const total = wallet + bank;

    // Itens de Informação (Carteira, Banco, Total)
    const items = [
      { label: 'Carteira', value: formatNumber(wallet), short: formatShort(wallet), color: '#2ecc71', icon: '💵' },
      { label: 'Banco', value: formatNumber(bank), short: formatShort(bank), color: '#3498db', icon: '🏦' },
      { label: 'Total', value: formatNumber(total), short: formatShort(total), color: '#f1c40f', icon: '🪙' },
    ];

    let startY = 250;
    const boxWidth = 440;
    const boxHeight = 55;
    const boxX = (width - boxWidth) / 2;

    items.forEach((item, index) => {
      const y = startY + index * 70;

      // Caixa cinza/roxa clara arredondada igual ao Zany
      ctx.save();
      ctx.beginPath();
      const r = 15;
      ctx.moveTo(boxX + r, y);
      ctx.lineTo(boxX + boxWidth - r, y);
      ctx.quadraticCurveTo(boxX + boxWidth, y, boxX + boxWidth, y + r);
      ctx.lineTo(boxX + boxWidth, y + boxHeight - r);
      ctx.quadraticCurveTo(boxX + boxWidth, y + boxHeight, boxX + boxWidth - r, y + boxHeight);
      ctx.lineTo(boxX + r, y + boxHeight);
      ctx.quadraticCurveTo(boxX, y + boxHeight, boxX, y + boxHeight - r);
      ctx.lineTo(boxX, y + r);
      ctx.quadraticCurveTo(boxX, y, boxX + r, y);
      ctx.closePath();
      ctx.fillStyle = '#f4f5f7';
      ctx.fill();
      ctx.restore();

      // Indicador colorido à esquerda da pílula
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(boxX, y, 10, boxHeight, [15, 0, 0, 15]);
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.restore();

      // Texto do Rótulo
      ctx.fillStyle = '#4f545c';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, boxX + 30, y + 33);

      // Texto do Valor
      ctx.fillStyle = '#2f3136';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.value} (${item.short})`, boxX + boxWidth - 20, y + 33);
    });

    const buffer = canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, { name: 'saldo-zero-two.png' });
  }
}
