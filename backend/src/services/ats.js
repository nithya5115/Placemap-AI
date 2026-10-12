// Rule-based ATS ESTIMATE. Not a score from any real company's system.
// Formula: score = round(0.7 * keywordMatch% + 0.3 * sectionCompleteness%)
export const SKILLS = ['java','python','javascript','typescript','c++','c#','c','sql','mysql','mongodb','postgresql','react','node.js','express','spring boot','hibernate','html','css','tailwind','git','github','docker','kubernetes','aws','azure','linux','rest api','data structures','algorithms','oop','machine learning','django','flask','agile','ci/cd','junit','communication','problem solving','teamwork','leadership'];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
const has = (text, skill) => new RegExp(`(?<![a-z0-9+#])${esc(skill)}(?![a-z0-9+#])`, 'i').test(text);

export const extractSkills = (text = '') => SKILLS.filter((s) => has(text, s));

export function resumeToText(d = {}) {
  const p = d.personal || {};
  return [d.rawText, p.summary, ...(d.skills || []), ...(d.projects || []).flatMap((x) => [x.name, x.description, x.tech]),
    ...(d.internships || []).flatMap((x) => [x.role, x.description]), ...(d.certifications || []),
    ...(d.education || []).map((e) => e.degree)].filter(Boolean).join(' \n ');
}

export function completeness(d = {}) {
  if (d.rawText) {
    const t = d.rawText;
    const c = [/@/.test(t), /summary|objective|profile/i.test(t), /education|b\.?tech|bachelor|master|university|college/i.test(t), extractSkills(t).length > 0, /project|intern|experience/i.test(t)];
    return Math.round((c.filter(Boolean).length / c.length) * 100);
  }
  const p = d.personal || {};
  const checks = [!!(p.name && p.email), !!p.summary, (d.education || []).length > 0, (d.skills || []).length > 0, (d.projects || []).length > 0 || (d.internships || []).length > 0];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function analyze(resumeData, jobText) {
  const required = extractSkills(jobText);
  const text = resumeToText(resumeData);
  const matched = required.filter((s) => has(text, s));
  const missing = required.filter((s) => !matched.includes(s));
  const keyword = required.length ? Math.round((matched.length / required.length) * 100) : 0;
  const comp = completeness(resumeData);
  const score = required.length ? Math.round(0.7 * keyword + 0.3 * comp) : null;
  const suggestions = [];
  if (!required.length) suggestions.push('No known skills were found in the job description. Paste the full text.');
  if (missing.length) suggestions.push(`Add these skills only if you genuinely have them: ${missing.join(', ')}.`);
  if (comp < 100) suggestions.push('Complete all sections: contact, summary, education, skills, projects/internships.');
  if (!(resumeData?.personal?.summary || '').trim()) suggestions.push('Write a 2-3 line professional summary.');
  return { score, keywordMatch: keyword, completeness: comp, matched, missing, suggestions,
    disclaimer: 'Estimated heuristic score. It is not produced by any real company ATS.' };
}
