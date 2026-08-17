import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = "./knowledge/pdfs/mental_health_rag_kb.pdf"
os.makedirs(os.path.dirname(pdf_path), exist_ok=True)

doc = SimpleDocTemplate(pdf_path, pagesize=letter)
styles = getSampleStyleSheet()

title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=18, leading=22, spaceAfter=12)
heading_style = ParagraphStyle('HeadingStyle', parent=styles['Heading2'], fontSize=14, leading=18, spaceAfter=8)
body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=6)

content = []

sections = [
    ("Mental Health RAG Knowledge Base - Bilingual Edition", "Primary Sources: WHO ICD-11 CDDR & NIMH Mental Health Clinical Topics."),
    ("1. Depressive Disorders / الاضطرابات الاكتئابية", "Definition: Persistent depressed mood, loss of interest or pleasure, accompanied by cognitive and behavioral symptoms causing distress. Keywords: depression, major depressive episode, low mood, anhedonia, اكتئاب, مزاج منخفض."),
    ("2. Generalized Anxiety Disorder (GAD) / اضطراب القلق العام", "Definition: Excessive and persistent anxiety and worry about multiple life areas, difficulty controlling worry, muscle tension, and restlessness. Keywords: GAD, generalized anxiety, excessive worry, chronic worry, قلق عام, توتر, قلق مفرط."),
    ("3. Panic Disorder / اضطراب الهلع", "Definition: Recurrent unexpected panic attacks, sudden intense fear, palpitations, sweating, shortness of breath, and fear of losing control or dying. Keywords: panic disorder, panic attack, unexpected panic, fear of dying, palpitations, اضطراب الهلع, نوبة هلع, خفقان القلب."),
    ("4. Social Anxiety Disorder / اضطراب القلق الاجتماعي", "Definition: Marked fear or anxiety in social or performance situations where the person may be scrutinized, fear of negative evaluation and embarrassment. Keywords: social anxiety, social phobia, fear of evaluation, social avoidance, قلق اجتماعي, رهاب اجتماعي, إحراج."),
    ("5. Obsessive-Compulsive Disorder (OCD) / اضطراب الوسواس القهري", "Definition: Characterized by recurrent intrusive unwanted thoughts/images (obsessions) and repetitive behaviors or mental acts (compulsions). Keywords: OCD, obsession, compulsion, intrusive thoughts, checking, contamination, وسواس قهري, أفكار اقتحامية, طقوس."),
    ("6. Post-Traumatic Stress Disorder (PTSD) / اضطراب ما بعد الصدمة", "Definition: Trauma-related disorder involving re-experiencing traumatic events, intrusive memories, flashbacks, nightmares, hypervigilance, and avoidance. Keywords: PTSD, trauma, flashback, nightmares, avoidance, hypervigilance, اضطراب ما بعد الصدمة, كوابيس, فلاش باك, إيذاء النفس."),
    ("7. Bipolar Disorder / الاضطراب ثنائي القطب", "Definition: Mood disorder involving episodes of mania/hypomania and depressive episodes, with significant changes in mood, energy, and activity. Keywords: bipolar disorder, mania, hypomania, mood episode, reduced need for sleep, اضطراب ثنائي القطب, هوس, نوبة مزاجية."),
    ("8. Schizophrenia / Primary Psychotic Disorders / الفصام والذهان", "Definition: Disturbances in perception, beliefs (delusions), thinking (disorganized speech), and hallucinations. Keywords: psychosis, schizophrenia, delusions, hallucinations, disorganized thinking, ذهان, فصام, ضالالت, هالوس."),
    ("9. Eating Disorders / اضطرابات الأكل", "Definition: Disturbed eating behavior, food-related concerns, body image concerns, restriction, bingeing, or purging patterns. Keywords: eating disorder, anorexia, bulimia, binge eating, ARFID, restriction, purging, اضطراب أكل, فقدان الشهية, شهية."),
    ("10. Self-Harm / Suicidal Thoughts and Behavior / إيذاء النفس والسلوكيات الانتحارية", "Definition: Safety-critical phenomena. Clinical assessment requires evaluating immediacy, intent, plan, and protective factors. Always escalate to qualified human professional. Keywords: suicide, suicidal ideation, suicide attempt, self-harm, safety assessment, انتحار, أفكار انتحارية, إيذاء النفس.")
]

for title, text in sections:
    content.append(Paragraph(title, heading_style))
    content.append(Paragraph(text, body_style))
    content.append(Spacer(1, 10))

doc.build(content)
print(f"✅ Generated seed PDF at '{pdf_path}'")
