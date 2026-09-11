const PDFDocument = require('pdfkit');

const COLORS = {
  stone: '#070b0a',
  moss: '#1b3d32',
  ember: '#f0591e',
  muted: '#4a5550',
  line: '#d8ded9',
  soft: '#f1f4f2',
  white: '#ffffff',
};

function asList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function asItinerary(value) {
  const list = asList(value);
  return list
    .map((day) => ({
      day: day.day ?? day.Day ?? '',
      title: day.title || day.Title || 'Schedule',
      description: day.description || day.Description || '',
      activities: asList(day.activities || day.Activities),
      meals: asList(day.meals || day.Meals),
      accommodation: day.accommodation || day.Accommodation || '',
    }))
    .sort((a, b) => Number(a.day) - Number(b.day));
}

function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `\u20B9${v.toLocaleString('en-IN')}`;
}

function isTour(adventure) {
  return String(adventure?.category || '').toLowerCase() === 'tour';
}

function coachChoiceLabel(choice) {
  const extra = Math.max(0, Number(choice?.extra_per_person) || 0);
  const label = choice?.label || choice?.id || 'Option';
  return extra > 0 ? `${label} (+\u20B9${extra.toLocaleString('en-IN')} / person)` : `${label} (included)`;
}

function tourPricingNotes(adventure) {
  const groups = asList(adventure?.pricing_options);
  if (!groups.length) return [];
  const notes = [];
  for (const g of groups) {
    const groupKey = String(g.group || '').toLowerCase();
    const choices = asList(g.choices);
    if (groupKey === 'train' || /train/i.test(g.label || '')) {
      const labels = choices.map(coachChoiceLabel).filter(Boolean);
      notes.push(
        labels.length
          ? `Train travel is booked per person: ${labels.join(' or ')}.`
          : 'Train travel is booked per person (Sleeper coach or 3AC).'
      );
    } else if (groupKey === 'room' || /stay|room/i.test(g.label || '')) {
      notes.push('Stay is group stay — three people share a room. Twin and private rooms are not offered.');
    } else if (choices.length) {
      notes.push(`${g.label || groupKey}: ${choices.map((c) => c.label || c.id).join(', ')}.`);
    }
  }
  return notes;
}

function slugName(title) {
  return String(title || 'adventure')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'adventure';
}

const FOOTER_RESERVE = 40; // keep body clear of footer band

function pageContentBottom(doc) {
  return doc.page.height - Math.max(doc.page.margins.bottom, FOOTER_RESERVE);
}

function remainingSpace(doc) {
  return pageContentBottom(doc) - doc.y;
}

/**
 * Start a new page only when leftover space is too tight for the next block.
 * Never opens an extra page if we are already at the top (avoids blank pages).
 */
function breakIfTight(doc, minRemain = 36) {
  if (remainingSpace(doc) >= minRemain) return;
  if (doc.y <= doc.page.margins.top + 8) return;
  doc.addPage();
  resetCursor(doc, doc.page.margins.top);
}

function contentWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function resetCursor(doc, y = null) {
  doc.x = doc.page.margins.left;
  if (y != null) doc.y = y;
}

function drawHeaderBar(doc, adventure, audience = 'ops') {
  const { left, right } = { left: doc.page.margins.left, right: doc.page.width - doc.page.margins.right };
  const width = right - left;

  doc.save();
  doc.rect(0, 0, doc.page.width, 92).fill(COLORS.moss);
  doc.rect(0, 92, doc.page.width, 4).fill(COLORS.ember);
  doc.restore();

  doc.fillColor(COLORS.white)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('PHOENIX ADVENTURES', left, 22, { characterSpacing: 1.2 });

  const tour = isTour(adventure);
  const subtitle =
    audience === 'customer'
      ? tour
        ? 'YOUR TRIP GUIDE  ·  ITINERARY & PICKUPS'
        : 'YOUR TRIP GUIDE  ·  ITINERARY & PACKING'
      : tour
        ? 'TOUR PACKAGE  ·  DETAILED ITINERARY'
        : 'TREK · CAMP · TOUR  ·  DETAILED ITINERARY';

  doc.fillColor('#c5d4cc')
    .font('Helvetica')
    .fontSize(8)
    .text(subtitle, left, 38);

  doc.fillColor(COLORS.white)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(adventure.title || 'Adventure itinerary', left, 54, {
      width: width * 0.72,
      ellipsis: true,
    });

  doc.fillColor('#c5d4cc')
    .font('Helvetica')
    .fontSize(8)
    .text(
      `Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      left + width * 0.72,
      58,
      { width: width * 0.28, align: 'right' }
    );

  doc.y = 112;
  doc.x = left;
}

function drawMetaGrid(doc, adventure) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;
  const col = width / 3;
  const cells = [
    ['Location', adventure.location],
    ['Duration', adventure.duration],
    ['Category', adventure.category],
    ['Price / person', Number.isFinite(Number(adventure.price)) ? money(adventure.price) : ''],
    ['Difficulty', adventure.difficulty],
    ['Group size', adventure.max_participants ? `Up to ${adventure.max_participants}` : ''],
    ['Region', adventure.region],
    ['Base village', adventure.base_village],
    ['Elevation', adventure.elevation],
    ['Start time (IST)', adventure.start_time || '08:00'],
    ['Status', adventure.status],
    ['Price note', adventure.price_note],
  ].filter(([, value]) => value != null && String(value).trim() !== '' && String(value) !== '—');

  while (cells.length % 3 !== 0) {
    cells.push(['', '']);
  }

  const rows = [];
  for (let i = 0; i < cells.length; i += 3) {
    rows.push(cells.slice(i, i + 3));
  }

  rows.forEach((row) => {
    breakIfTight(doc, 34);
    const y = doc.y;
    row.forEach((cell, i) => {
      if (!cell[0]) return;
      const x = left + i * col;
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7).text(String(cell[0]).toUpperCase(), x, y, {
        width: col - 10,
        characterSpacing: 0.6,
        lineBreak: false,
      });
      doc.fillColor(COLORS.stone).font('Helvetica-Bold').fontSize(9).text(String(cell[1]), x, y + 11, {
        width: col - 10,
        lineBreak: false,
        ellipsis: true,
      });
    });
    resetCursor(doc, y + 34);
  });

  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor(COLORS.line).lineWidth(0.8).stroke();
  doc.moveDown(0.6);
}

function sectionTitle(doc, title) {
  breakIfTight(doc, 34);
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  resetCursor(doc);
  doc.fillColor(COLORS.ember).font('Helvetica-Bold').fontSize(11).text(title.toUpperCase(), left, doc.y, {
    characterSpacing: 1,
    width: contentWidth(doc),
  });
  resetCursor(doc);
  doc.moveDown(0.15);
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor(COLORS.line).lineWidth(0.6).stroke();
  doc.moveDown(0.45);
  resetCursor(doc);
}

function paragraph(doc, text) {
  if (!text) return;
  breakIfTight(doc, 20);
  const left = doc.page.margins.left;
  const width = contentWidth(doc);
  resetCursor(doc);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9.5).text(String(text), left, doc.y, {
    width,
    align: 'left',
    lineGap: 2.5,
  });
  resetCursor(doc);
  doc.moveDown(0.45);
}

function bulletList(doc, items, emptyLabel = null) {
  const list = asList(items);
  if (!list.length) {
    if (emptyLabel) {
      resetCursor(doc);
      doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(9).text(emptyLabel, doc.page.margins.left, doc.y, {
        width: contentWidth(doc),
      });
      resetCursor(doc);
      doc.moveDown(0.4);
    }
    return;
  }
  list.forEach((item) => {
    breakIfTight(doc, 14);
    const left = doc.page.margins.left;
    const bulletX = left;
    const textX = left + 12;
    const width = doc.page.width - doc.page.margins.right - textX;
    const y = doc.y;
    doc.circle(bulletX + 3, y + 5, 1.6).fill(COLORS.ember);
    doc.fillColor(COLORS.stone).font('Helvetica').fontSize(9.5).text(String(item), textX, y, {
      width,
      lineGap: 1.5,
    });
    resetCursor(doc);
    doc.moveDown(0.15);
  });
  doc.moveDown(0.25);
}

/** Full-width stacked lists — avoids two-column page-break blank pages. */
function stackedLists(doc, sectionLabel, leftTitle, leftItems, rightTitle, rightItems) {
  const left = asList(leftItems);
  const right = asList(rightItems);
  if (!left.length && !right.length) return;

  sectionTitle(doc, sectionLabel);
  if (left.length) {
    breakIfTight(doc, 18);
    resetCursor(doc);
    doc.fillColor(COLORS.moss).font('Helvetica-Bold').fontSize(9).text(leftTitle, doc.page.margins.left, doc.y, {
      width: contentWidth(doc),
    });
    resetCursor(doc);
    doc.moveDown(0.25);
    bulletList(doc, left);
  }
  if (right.length) {
    breakIfTight(doc, 18);
    resetCursor(doc);
    doc.fillColor(COLORS.moss).font('Helvetica-Bold').fontSize(9).text(rightTitle, doc.page.margins.left, doc.y, {
      width: contentWidth(doc),
    });
    resetCursor(doc);
    doc.moveDown(0.25);
    bulletList(doc, right);
  }
}

/**
 * Full-width day block.
 * Layout: soft header strip â†’ body text â†’ activities / meals / stay.
 */
function drawDayCard(doc, day, index, total) {
  // Only need room for the header strip; body flows naturally onto next pages
  breakIfTight(doc, 44);
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;
  const top = doc.y;

  doc.save();
  doc.roundedRect(left, top, width, 28, 3).fill(COLORS.soft);
  doc.restore();

  doc.fillColor(COLORS.ember)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(`DAY ${day.day || index + 1}`, left + 12, top + 9, { width: 56, lineBreak: false });

  doc.fillColor(COLORS.stone)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(day.title || 'Schedule', left + 72, top + 9, {
      width: width - 120,
      lineBreak: false,
      ellipsis: true,
    });

  doc.fillColor(COLORS.muted)
    .font('Helvetica')
    .fontSize(8)
    .text(`${index + 1} / ${total}`, left + width - 48, top + 10, {
      width: 36,
      align: 'right',
      lineBreak: false,
    });

  resetCursor(doc, top + 40);

  if (day.description) {
    doc.fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(9.5)
      .text(String(day.description), left, doc.y, {
        width,
        align: 'left',
        lineGap: 2.5,
      });
    resetCursor(doc);
    doc.moveDown(0.45);
  }

  if (day.activities.length) {
    breakIfTight(doc, 20);
    resetCursor(doc);
    doc.fillColor(COLORS.moss).font('Helvetica-Bold').fontSize(8.5).text('ACTIVITIES', left, doc.y, { width });
    resetCursor(doc);
    doc.moveDown(0.2);
    bulletList(doc, day.activities);
  }

  if (day.meals.length) {
    breakIfTight(doc, 18);
    resetCursor(doc);
    doc.fillColor(COLORS.moss).font('Helvetica-Bold').fontSize(8.5).text('MEALS', left, doc.y, { width });
    resetCursor(doc);
    doc.moveDown(0.15);
    doc.fillColor(COLORS.stone).font('Helvetica').fontSize(9).text(day.meals.join('  ·  '), left, doc.y, { width });
    resetCursor(doc);
    doc.moveDown(0.45);
  }

  if (day.accommodation) {
    breakIfTight(doc, 18);
    resetCursor(doc);
    doc.fillColor(COLORS.moss).font('Helvetica-Bold').fontSize(8.5).text('ACCOMMODATION', left, doc.y, { width });
    resetCursor(doc);
    doc.moveDown(0.15);
    doc.fillColor(COLORS.stone).font('Helvetica').fontSize(9).text(day.accommodation, left, doc.y, { width });
    resetCursor(doc);
    doc.moveDown(0.45);
  }

  if (remainingSpace(doc) >= 10) {
    resetCursor(doc);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor(COLORS.line).lineWidth(0.5).stroke();
    doc.moveDown(0.45);
    resetCursor(doc);
  }
}

/**
 * Draw footer without triggering PDFKit's auto page-break (which creates blank pages).
 */
function drawFooter(doc, pageNumber, pageCount, audience = 'ops') {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const y = doc.page.height - 30;
  const savedX = doc.x;
  const savedY = doc.y;
  const savedBottom = doc.page.margins.bottom;

  // Allow drawing inside the bottom margin without spawning a new page
  doc.page.margins.bottom = 0;

  doc.save();
  doc.moveTo(left, y - 10).lineTo(right, y - 10).strokeColor(COLORS.line).lineWidth(0.5).stroke();
  doc.fillColor(COLORS.muted)
    .font('Helvetica')
    .fontSize(7.5)
    .text(
      audience === 'customer'
        ? 'Phoenix Adventures  ·  Bring a valid ID  ·  Questions? +91 93725 06447'
        : 'Phoenix Adventures  ·  For operational use',
      left,
      y,
      { width: (right - left) * 0.68, lineBreak: false }
    );
  doc.fillColor(COLORS.muted)
    .font('Helvetica')
    .fontSize(7.5)
    .text(`Page ${pageNumber} of ${pageCount}`, left + (right - left) * 0.68, y, {
      width: (right - left) * 0.32,
      align: 'right',
      lineBreak: false,
    });
  doc.restore();

  doc.page.margins.bottom = savedBottom;
  doc.x = savedX;
  doc.y = savedY;
}

/**
 * Build a professional, detailed itinerary PDF buffer for an adventure.
 * @param {object} adventure
 * @param {{ audience?: 'ops' | 'customer' }} [options]
 * @returns {Promise<{ buffer: Buffer, filename: string }>}
 */
function buildItineraryPdf(adventure, options = {}) {
  const audience = options.audience === 'customer' ? 'customer' : 'ops';
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        bufferPages: true,
        margins: { top: 48, bottom: 56, left: 48, right: 48 },
        info: {
          Title: `${adventure.title || 'Adventure'} — Itinerary`,
          Author: 'Phoenix Adventures',
          Subject: audience === 'customer' ? 'Your trip itinerary' : 'Detailed trip itinerary',
          Creator: 'Phoenix Adventures',
        },
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('error', reject);
      doc.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `${slugName(adventure.title)}-itinerary.pdf`,
        });
      });

      // Page numbers stamped after layout is complete.
      drawHeaderBar(doc, adventure, audience);
      drawMetaGrid(doc, adventure);

      if (adventure.description) {
        sectionTitle(doc, 'About this adventure');
        paragraph(doc, adventure.description);
      }

      const itinerary = asItinerary(adventure.itinerary);
      sectionTitle(doc, 'Day-by-day itinerary');
      if (!itinerary.length) {
        doc.fillColor(COLORS.muted)
          .font('Helvetica-Oblique')
          .fontSize(9.5)
          .text('No day-by-day itinerary has been added for this adventure yet.');
        doc.moveDown(0.6);
      } else {
        itinerary.forEach((day, i) => drawDayCard(doc, day, i, itinerary.length));
      }

      stackedLists(doc, 'Inclusions & exclusions', 'Included', adventure.included, 'Not included', adventure.excluded);

      const pricingNotes = isTour(adventure) ? tourPricingNotes(adventure) : [];
      if (pricingNotes.length) {
        sectionTitle(doc, 'Travel & stay');
        bulletList(doc, pricingNotes);
      }

      const mumbai = asList(adventure.pickup_mumbai);
      const pune = asList(adventure.pickup_pune);
      if (mumbai.length || pune.length) {
        sectionTitle(doc, 'Pickup points');
        if (mumbai.length) {
          doc.fillColor(COLORS.moss).font('Helvetica-Bold').fontSize(9).text('Mumbai');
          doc.moveDown(0.2);
          bulletList(doc, mumbai);
        }
        if (pune.length) {
          doc.fillColor(COLORS.moss).font('Helvetica-Bold').fontSize(9).text('Pune');
          doc.moveDown(0.2);
          bulletList(doc, pune);
        }
      }

      const packing = asList(adventure.things_to_carry);
      if (packing.length) {
        sectionTitle(doc, 'What to pack');
        bulletList(doc, packing);
      }

      const dos = asList(adventure.dos);
      const donts = asList(adventure.donts);
      if (dos.length || donts.length) {
        stackedLists(doc, "Do's & Don'ts", "Do's", dos, "Don'ts", donts);
      }

      const guidelines = asList(adventure.trek_guidelines);
      if (guidelines.length) {
        sectionTitle(doc, 'Trek guidelines');
        bulletList(doc, guidelines);
      }

      const dates = asList(adventure.available_dates);
      if (dates.length) {
        sectionTitle(doc, 'Scheduled departures');
        bulletList(
          doc,
          dates.map((d) => {
            try {
              const [y, m, day] = String(d).split('-').map(Number);
              return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              });
            } catch {
              return String(d);
            }
          })
        );
      }

      const tour = isTour(adventure);
      sectionTitle(doc, audience === 'customer' ? 'Before you go' : 'Operational notes');
      paragraph(
        doc,
        audience === 'customer'
          ? tour
            ? 'Save this itinerary for the day plan, pickups, train class, and stay notes. Our team will share the exact reporting time on WhatsApp before departure. Bring a valid government ID. For help call +91 93725 06447 / +91 77580 79726 or email pheonixadventuress@gmail.com.'
            : 'Save this itinerary for pickup points, packing, and day-wise plans. Our team will share the exact reporting time on WhatsApp before departure. Bring a valid government ID. For help call +91 93725 06447 / +91 77580 79726 or email pheonixadventuress@gmail.com.'
          : 'This document is generated from the adventure package in Phoenix Adventures Admin. ' +
              'Share with trip leaders and ops for pickup timings and day-wise execution. ' +
              'Customer confirmations attach this itinerary PDF automatically when payment is verified.'
      );

      // Stamp footers on every page without creating extras
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        drawFooter(doc, i + 1, range.count, audience);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  buildItineraryPdf,
  slugName,
};

