/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Find fixtures.json
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'fixtures.json'),
    path.join(__dirname, '..', 'fixtures.json'),
    path.join(process.cwd(), 'fixtures.json'),
    path.join(process.cwd(), '..', 'fixtures.json')
  ];

  let fixturePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      fixturePath = p;
      break;
    }
  }

  if (!fixturePath) {
    console.error('fixtures.json not found in candidate paths:', possiblePaths);
    process.exit(1);
  }

  console.log(`Loading fixtures from: ${fixturePath}`);
  const fixtures = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const defaultPasswordHash = await bcrypt.hash('Dogfood2026!', 10);

  // 1. Seed Organizer
  console.log('Seeding Organizer account...');
  await db.user.upsert({
    where: { email: 'organizer@example.org' },
    update: { role: 'ORGANIZER', name: 'Lead Organizer' },
    create: {
      id: 'usr_org_01',
      email: 'organizer@example.org',
      name: 'Lead Organizer',
      role: 'ORGANIZER',
      passwordHash: defaultPasswordHash
    }
  });

  // 2. Seed Hackathon Event
  console.log(`Seeding event: ${fixtures.event.name} (${fixtures.event.id})...`);
  const submissionsClose = new Date(fixtures.event.submissions_close);
  const startDate = new Date('2026-02-25T00:00:00Z');

  await db.hackathon.upsert({
    where: { id: fixtures.event.id },
    update: {
      name: fixtures.event.name,
      description: 'Official Dogfood 2026 Hackathon Competition',
      startDate,
      endDate: submissionsClose,
      votingOpen: false
    },
    create: {
      id: fixtures.event.id,
      name: fixtures.event.name,
      description: 'Official Dogfood 2026 Hackathon Competition',
      startDate,
      endDate: submissionsClose,
      votingOpen: false
    }
  });

  // 3. Seed Tracks
  console.log(`Seeding ${fixtures.tracks.length} tracks...`);
  for (const track of fixtures.tracks) {
    await db.track.upsert({
      where: { id: track.id },
      update: { name: track.name, description: `Focus track for ${track.name}` },
      create: {
        id: track.id,
        name: track.name,
        description: `Focus track for ${track.name}`,
        hackathonId: fixtures.event.id
      }
    });
  }

  // 4. Seed Judges
  console.log(`Seeding ${fixtures.judges.length} judges...`);
  for (const judge of fixtures.judges) {
    await db.user.upsert({
      where: { email: judge.email },
      update: { name: judge.name, role: 'JUDGE' },
      create: {
        id: judge.id,
        email: judge.email,
        name: judge.name,
        role: 'JUDGE',
        passwordHash: defaultPasswordHash
      }
    });
  }

  // 5. Seed Teams & Members
  console.log(`Seeding ${fixtures.teams.length} teams...`);
  for (let i = 0; i < fixtures.teams.length; i++) {
    const t = fixtures.teams[i];
    const paddedIndex = String(i + 1).padStart(3, '0');
    const joinCode = `TM${paddedIndex}`;

    const team = await db.team.upsert({
      where: { id: t.id },
      update: { name: t.name },
      create: {
        id: t.id,
        name: t.name,
        joinCode,
        hackathonId: fixtures.event.id
      }
    });

    // Create team members
    for (let mIdx = 0; mIdx < t.members.length; mIdx++) {
      const email = t.members[mIdx];
      let user = await db.user.findUnique({ where: { email } });
      if (!user) {
        user = await db.user.create({
          data: {
            email,
            name: email.split('@')[0],
            role: 'PARTICIPANT',
            passwordHash: defaultPasswordHash
          }
        });
      }

      // Check membership
      const existingMembership = await db.teamMember.findFirst({
        where: { userId: user.id, teamId: team.id }
      });
      if (!existingMembership) {
        await db.teamMember.create({
          data: {
            userId: user.id,
            teamId: team.id
          }
        });
      }
    }
  }

  // 6. Seed Projects
  console.log(`Seeding ${fixtures.projects.length} projects...`);
  for (const p of fixtures.projects) {
    await db.project.upsert({
      where: { id: p.id },
      update: {
        name: p.title,
        description: p.summary,
        repoUrl: p.repo_url,
        status: 'SUBMITTED',
        trackId: p.track,
        teamId: p.team
      },
      create: {
        id: p.id,
        name: p.title,
        description: p.summary,
        repoUrl: p.repo_url,
        status: 'SUBMITTED',
        trackId: p.track,
        teamId: p.team
      }
    });
  }

  // 7. Seed Rubric & Criteria
  console.log('Seeding official scoring rubric...');
  let rubric = await db.rubric.findFirst({
    where: { hackathonId: fixtures.event.id }
  });

  if (!rubric) {
    rubric = await db.rubric.create({
      data: {
        name: 'Standard Evaluation Rubric',
        hackathonId: fixtures.event.id
      }
    });
  }

  const criteriaDefs = [
    { name: 'Functionality', key: 'functionality', weight: 0.40, maxScore: 5 },
    { name: 'Quality', key: 'quality', weight: 0.30, maxScore: 5 },
    { name: 'Innovation', key: 'innovation', weight: 0.30, maxScore: 5 }
  ];

  const criteriaMap = {};
  for (const c of criteriaDefs) {
    let crit = await db.criteria.findFirst({
      where: { rubricId: rubric.id, name: c.name }
    });
    if (!crit) {
      crit = await db.criteria.create({
        data: {
          name: c.name,
          weight: c.weight,
          maxScore: c.maxScore,
          rubricId: rubric.id
        }
      });
    }
    criteriaMap[c.key] = crit.id;
  }

  // 8. Seed Scores
  console.log(`Seeding ${fixtures.scores.length} evaluation scores...`);
  for (const s of fixtures.scores) {
    // Calculate total weighted score
    let totalScore = 0;
    for (const def of criteriaDefs) {
      const raw = s.criteria[def.key] || 0;
      totalScore += raw * def.weight;
    }

    const evalRecord = await db.evaluation.upsert({
      where: {
        judgeId_projectId: {
          judgeId: s.judge,
          projectId: s.project
        }
      },
      update: {
        totalScore,
        comment: s.comment || null,
        completed: true
      },
      create: {
        judgeId: s.judge,
        projectId: s.project,
        totalScore,
        comment: s.comment || null,
        completed: true
      }
    });

    // Seed per-criteria evaluation scores
    for (const [critKey, scoreVal] of Object.entries(s.criteria)) {
      const critId = criteriaMap[critKey];
      if (critId) {
        const existingScore = await db.evaluationScore.findFirst({
          where: { evaluationId: evalRecord.id, criteriaId: critId }
        });
        if (!existingScore) {
          await db.evaluationScore.create({
            data: {
              evaluationId: evalRecord.id,
              criteriaId: critId,
              score: Number(scoreVal)
            }
          });
        }
      }
    }
  }

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
