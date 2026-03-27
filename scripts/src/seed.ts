import { db, familyMembersTable, vitalsReadingsTable, healthAlertsTable } from "@workspace/db";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function gaussianRandom(mean: number, std: number) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

async function seed() {
  console.log("Seeding database...");

  await db.delete(healthAlertsTable);
  await db.delete(vitalsReadingsTable);
  await db.delete(familyMembersTable);

  const members = await db.insert(familyMembersTable).values([
    {
      name: "Sarah Johnson",
      age: 38,
      relationship: "You",
      avatarInitials: "SJ",
      wearableSource: "apple_watch",
      isHighRisk: false,
      guardianViewEnabled: false,
    },
    {
      name: "Michael Johnson",
      age: 41,
      relationship: "Spouse",
      avatarInitials: "MJ",
      wearableSource: "whoop",
      isHighRisk: false,
      guardianViewEnabled: false,
    },
    {
      name: "Eleanor Johnson",
      age: 72,
      relationship: "Mother",
      avatarInitials: "EJ",
      wearableSource: "apple_watch",
      isHighRisk: true,
      guardianViewEnabled: true,
    },
    {
      name: "Lucas Johnson",
      age: 16,
      relationship: "Son",
      avatarInitials: "LJ",
      wearableSource: "garmin",
      isHighRisk: false,
      guardianViewEnabled: false,
    },
  ]).returning();

  console.log(`Created ${members.length} family members`);

  const profiles = [
    { avgHrv: 58, stdHrv: 8, avgHr: 62, stdHr: 4, avgSpo2: 98.2, stdSpo2: 0.4, avgSleep: 78 },
    { avgHrv: 45, stdHrv: 7, avgHr: 68, stdHr: 5, avgSpo2: 97.8, stdSpo2: 0.5, avgSleep: 72 },
    { avgHrv: 28, stdHrv: 6, avgHr: 74, stdHr: 6, avgSpo2: 96.5, stdSpo2: 0.8, avgSleep: 65 },
    { avgHrv: 72, stdHrv: 10, avgHr: 58, stdHr: 5, avgSpo2: 98.5, stdSpo2: 0.3, avgSleep: 85 },
  ];

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const profile = profiles[i];

    const readings = [];
    for (let day = 29; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(6, 30, 0, 0);

      let hrv = gaussianRandom(profile.avgHrv, profile.stdHrv);
      let hr = gaussianRandom(profile.avgHr, profile.stdHr);
      let spo2 = gaussianRandom(profile.avgSpo2, profile.stdSpo2);
      let sleep = gaussianRandom(profile.avgSleep, 8);

      if (member.isHighRisk && day <= 3) {
        hrv = hrv * 0.65;
        hr = hr * 1.22;
        spo2 = Math.max(spo2 - 2.5, 93);
        sleep = sleep * 0.75;
      }

      hrv = Math.max(hrv, 10);
      hr = Math.max(hr, 40);
      spo2 = Math.min(Math.max(spo2, 90), 100);
      sleep = Math.min(Math.max(sleep, 30), 100);

      const flags: string[] = [];
      let anomalyScore = 0;
      const zHrv = (hrv - profile.avgHrv) / profile.stdHrv;
      const zHr = (hr - profile.avgHr) / profile.stdHr;
      const zSpo2 = (spo2 - profile.avgSpo2) / profile.stdSpo2;

      if (zHrv < -1.5) { flags.push("hrv_drop"); anomalyScore += 0.35; }
      if (zHr > 1.5) { flags.push("elevated_hr"); anomalyScore += 0.35; }
      if (zSpo2 < -1.5) { flags.push("low_spo2"); anomalyScore += 0.40; }
      if (zHrv < -1.5 && zHr > 1.5) { flags.push("combined_stress"); anomalyScore = Math.min(anomalyScore + 0.15, 1); }

      readings.push({
        memberId: member.id,
        timestamp: date,
        heartRateVariability: Math.round(hrv * 10) / 10,
        restingHeartRate: Math.round(hr * 10) / 10,
        spo2: Math.round(spo2 * 10) / 10,
        sleepScore: Math.round(sleep * 10) / 10,
        recoveryScore: Math.round(randomBetween(50, 95) * 10) / 10,
        bodyTemperature: Math.round(gaussianRandom(36.6, 0.2) * 100) / 100,
        respiratoryRate: Math.round(gaussianRandom(14, 1.5) * 10) / 10,
        anomalyScore: Math.min(anomalyScore, 1),
        anomalyFlags: JSON.stringify(flags),
      });
    }

    await db.insert(vitalsReadingsTable).values(readings);
    console.log(`Inserted ${readings.length} vitals readings for ${member.name}`);
  }

  const eleanor = members[2];
  const michael = members[1];

  await db.insert(healthAlertsTable).values([
    {
      memberId: eleanor.id,
      severity: "critical",
      alertType: "combined_stress",
      title: "Combined Stress Pattern Detected",
      description: "Eleanor's HRV dropped 38% below her personal baseline while resting heart rate elevated 24% above normal. This combined pattern may indicate an early infection or cardiac stress event.",
      deviationPercent: 38,
      detectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      resolved: false,
    },
    {
      memberId: eleanor.id,
      severity: "high",
      alertType: "low_spo2",
      title: "Blood Oxygen Below Threshold",
      description: "SpO2 readings have fallen to 93.5%, which is 3.1% below Eleanor's established personal baseline of 96.6%. Sustained low oxygen saturation warrants prompt attention.",
      deviationPercent: 32,
      detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      resolved: false,
    },
    {
      memberId: eleanor.id,
      severity: "medium",
      alertType: "hrv_drop",
      title: "HRV Significantly Below Baseline",
      description: "Heart Rate Variability has been trending downward for 3 consecutive days, now 28% below Eleanor's 30-day average.",
      deviationPercent: 28,
      detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resolved: false,
    },
    {
      memberId: michael.id,
      severity: "low",
      alertType: "hrv_drop",
      title: "Mild HRV Dip Detected",
      description: "Michael's HRV was 18% below baseline this morning, potentially linked to reduced sleep quality (sleep score: 61).",
      deviationPercent: 18,
      detectedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      resolved: false,
    },
    {
      memberId: eleanor.id,
      severity: "high",
      alertType: "elevated_hr",
      title: "Elevated Resting Heart Rate",
      description: "Resting heart rate measured at 91 bpm, 22% above Eleanor's normal baseline of 74 bpm. Pattern consistent with physiological stress response.",
      deviationPercent: 22,
      detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      resolved: true,
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log("Inserted health alerts");
  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
