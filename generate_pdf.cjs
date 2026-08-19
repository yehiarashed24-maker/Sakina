const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Arial', sans-serif; padding: 40px; line-height: 1.6; }
      h1 { color: #2c3e50; text-align: center; }
      h2 { color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
      .disease { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
      .keywords { color: #7f8c8d; font-size: 0.9em; }
    </style>
  </head>
  <body>
    <h1>دليل الصحة النفسية الشامل (المرجع الأساسي)</h1>
    <p>هذا المستند هو ملخص لأهم الاضطرابات النفسية وأعراضها، ويُستخدم كمرجع أساسي للمطابقة باللغة العربية.</p>
    
    <div class="disease">
      <h2>1. الاضطرابات الاكتئابية (Depressive Disorders)</h2>
      <p><strong>التعريف:</strong> مزاج مكتئب مستمر، فقدان الاهتمام أو المتعة، مصحوب بأعراض إدراكية وسلوكية تسبب ضيقاً شديداً.</p>
      <p class="keywords">الكلمات المفتاحية: depression, اكتئاب, مزاج منخفض, حزن.</p>
    </div>

    <div class="disease">
      <h2>2. اضطراب القلق العام (Generalized Anxiety Disorder)</h2>
      <p><strong>التعريف:</strong> قلق وتوتر مفرط ومستمر تجاه مجالات حياتية متعددة، مع صعوبة في السيطرة على القلق وتوتر عضلي.</p>
      <p class="keywords">الكلمات المفتاحية: GAD, قلق عام, توتر مفرط, قلق مزمن.</p>
    </div>

    <div class="disease">
      <h2>3. اضطراب الهلع (Panic Disorder)</h2>
      <p><strong>التعريف:</strong> نوبات هلع متكررة وغير متوقعة، خوف مفاجئ وشديد، خفقان، تعرق، ضيق في التنفس، وخوف من فقدان السيطرة.</p>
      <p class="keywords">الكلمات المفتاحية: panic attack, اضطراب الهلع, نوبة هلع, خفقان.</p>
    </div>

    <div class="disease">
      <h2>4. اضطراب القلق الاجتماعي (Social Anxiety Disorder)</h2>
      <p><strong>التعريف:</strong> خوف شديد أو قلق في المواقف الاجتماعية التي قد يتعرض فيها الشخص للتقييم أو الإحراج.</p>
      <p class="keywords">الكلمات المفتاحية: social phobia, رهاب اجتماعي, قلق اجتماعي, خوف من الناس, إحراج.</p>
    </div>

    <div class="disease">
      <h2>5. اضطراب الوسواس القهري (OCD)</h2>
      <p><strong>التعريف:</strong> يتميز بأفكار أو صور اقتحامية غير مرغوب فيها (هواجس) وسلوكيات متكررة (أفعال قهرية).</p>
      <p class="keywords">الكلمات المفتاحية: OCD, وسواس قهري, أفكار اقتحامية, طقوس.</p>
    </div>

    <div class="disease">
      <h2>6. اضطراب ما بعد الصدمة (PTSD)</h2>
      <p><strong>التعريف:</strong> اضطراب مرتبط بصدمة يشمل استرجاع الحدث، ذكريات اقتحامية، كوابيس، يقظة مفرطة، وتجنب.</p>
      <p class="keywords">الكلمات المفتاحية: PTSD, صدمة, فلاش باك, كوابيس, اضطراب ما بعد الصدمة.</p>
    </div>

    <div class="disease">
      <h2>7. الاضطراب ثنائي القطب (Bipolar Disorder)</h2>
      <p><strong>التعريف:</strong> اضطراب مزاجي يشمل نوبات هوس ونوبات اكتئاب مع تغيرات ملحوظة في المزاج والطاقة.</p>
      <p class="keywords">الكلمات المفتاحية: bipolar, ثنائي القطب, هوس, تقلبات مزاجية.</p>
    </div>

    <div class="disease">
      <h2>8. الفصام والذهان (Schizophrenia)</h2>
      <p><strong>التعريف:</strong> اضطرابات في الإدراك، المعتقدات (الضلالات)، التفكير (كلام غير منظم)، والهلوسة.</p>
      <p class="keywords">الكلمات المفتاحية: psychosis, فصام, ذهان, هلاوس, ضلالات.</p>
    </div>

    <div class="disease">
      <h2>9. اضطرابات الأكل (Eating Disorders)</h2>
      <p><strong>التعريف:</strong> سلوك أكل مضطرب، مخاوف متعلقة بالغذاء وصورة الجسم، تقييد أو نهم.</p>
      <p class="keywords">الكلمات المفتاحية: eating disorder, فقدان الشهية, شراهة, اضطراب أكل.</p>
    </div>

    <div class="disease">
      <h2>10. إيذاء النفس والسلوكيات الانتحارية (Suicidal Behavior)</h2>
      <p><strong>التعريف:</strong> أفكار أو سلوكيات تهدف لإلحاق الضرر بالنفس. تتطلب تقييماً فصلياً وتدخلاً طبياً فورياً.</p>
      <p class="keywords">الكلمات المفتاحية: suicide, انتحار, إيذاء النفس, أفكار انتحارية.</p>
    </div>

    <div class="disease">
      <h2>11. فرط الحركة وتشتت الانتباه (ADHD)</h2>
      <p><strong>التعريف:</strong> اضطراب نمو عصبي يتميز بنمط مستمر من عدم الانتباه أو فرط الحركة والاندفاع.</p>
      <p class="keywords">الكلمات المفتاحية: ADHD, فرط حركة, تشتت انتباه, نقص التركيز.</p>
    </div>

  </body>
  </html>
  `;
  
  fs.writeFileSync('temp.html', htmlContent);
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file://' + __dirname + '/temp.html', {waitUntil: 'networkidle0'});
  await page.pdf({ path: '/Users/yousef/Documents/sakinaia/data/raw/mental_health_rag_kb.pdf', format: 'A4', printBackground: true });
  await browser.close();
  console.log('PDF generated successfully!');
})();
