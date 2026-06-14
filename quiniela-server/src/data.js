// Datos base que se usan SIEMPRE como semilla. Si configuras la API de fútbol,
// el servidor amplía/actualiza partidos, resultados y jugadores automáticamente.

export const FIXTURES = [
  ['Catar','Suiza','2026-06-13T22:00:00Z','B','Levi’s Stadium · Santa Clara'],
  ['Brasil','Marruecos','2026-06-14T01:00:00Z','C','MetLife Stadium · Nueva York'],
  ['Haití','Escocia','2026-06-14T04:00:00Z','C','Gillette Stadium · Boston'],
  ['Alemania','Curazao','2026-06-14T18:00:00Z','E','NRG Stadium · Houston'],
  ['Australia','Egipto','2026-06-14T22:00:00Z','G','Lumen Field · Seattle'],
  ['Arabia Saudí','Uruguay','2026-06-15T01:00:00Z','H','Hard Rock Stadium · Miami'],
  ['Irán','Nueva Zelanda','2026-06-15T04:00:00Z','G','SoFi Stadium · Los Ángeles'],
  ['España','Cabo Verde','2026-06-15T21:00:00Z','H','Mercedes-Benz Stadium · Atlanta'],
  ['Francia','Senegal','2026-06-16T22:00:00Z','I','MetLife Stadium · Nueva York'],
  ['Argentina','Argelia','2026-06-17T04:00:00Z','J','Arrowhead Stadium · Kansas City'],
  ['Austria','Jordania','2026-06-17T22:00:00Z','J','Levi’s Stadium · San Francisco'],
  ['Sudáfrica','Corea del Sur','2026-06-18T20:00:00Z','A','Estadio Akron · Guadalajara'],
  ['Estados Unidos','Australia','2026-06-19T19:00:00Z','D','Lumen Field · Seattle'],
  ['Brasil','Haití','2026-06-20T01:00:00Z','C','Lincoln Financial · Filadelfia'],
  ['Escocia','Marruecos','2026-06-20T22:00:00Z','C','Gillette Stadium · Boston'],
  ['España','Arabia Saudí','2026-06-21T21:00:00Z','H','Mercedes-Benz Stadium · Atlanta'],
  ['Argentina','Austria','2026-06-23T02:00:00Z','J','AT&T Stadium · Dallas'],
  ['Suiza','Curazao','2026-06-24T20:00:00Z','B','Lumen Field · Seattle'],
  ['España','Uruguay','2026-06-27T02:00:00Z','H','Estadio Akron · Guadalajara'],
];

// [nombre, posición(POR/DEF/MED/DEL), precio en millones]
export const SQUADS = {
'España':[['Unai Simón','POR',8],['David Raya','POR',6],['Dani Carvajal','DEF',9],['Robin Le Normand','DEF',8],['Aymeric Laporte','DEF',8],['Marc Cucurella','DEF',8],['Pau Cubarsí','DEF',9],['Rodri','MED',28],['Pedri','MED',24],['Gavi','MED',16],['Fabián Ruiz','MED',12],['Mikel Merino','MED',12],['Lamine Yamal','DEL',32],['Nico Williams','DEL',24],['Dani Olmo','DEL',18],['Álvaro Morata','DEL',16],['Mikel Oyarzabal','DEL',14]],
'Brasil':[['Alisson','POR',10],['Ederson','POR',8],['Marquinhos','DEF',12],['Éder Militão','DEF',11],['Gabriel Magalhães','DEF',10],['Danilo','DEF',8],['Bruno Guimarães','MED',16],['Lucas Paquetá','MED',14],['Casemiro','MED',12],['Vinícius Júnior','DEL',34],['Rodrygo','DEL',24],['Raphinha','DEL',22],['Endrick','DEL',16],['Gabriel Jesus','DEL',14]],
'Argentina':[['Emiliano Martínez','POR',12],['Cristian Romero','DEF',12],['Lisandro Martínez','DEF',10],['Nicolás Otamendi','DEF',8],['Nahuel Molina','DEF',8],['Marcos Acuña','DEF',7],['Enzo Fernández','MED',16],['Alexis Mac Allister','MED',16],['Rodrigo De Paul','MED',12],['Giovani Lo Celso','MED',10],['Lionel Messi','DEL',36],['Julián Álvarez','DEL',24],['Lautaro Martínez','DEL',24],['Ángel Di María','DEL',14]],
'Francia':[['Mike Maignan','POR',10],['William Saliba','DEF',12],['Dayot Upamecano','DEF',10],['Theo Hernández','DEF',10],['Jules Koundé','DEF',10],['Ibrahima Konaté','DEF',9],['Aurélien Tchouaméni','MED',14],['Eduardo Camavinga','MED',14],['Adrien Rabiot','MED',10],['Warren Zaïre-Emery','MED',10],['Kylian Mbappé','DEL',38],['Ousmane Dembélé','DEL',24],['Michael Olise','DEL',22],['Marcus Thuram','DEL',16],['Bradley Barcola','DEL',14]],
'Alemania':[['Marc-André ter Stegen','POR',9],['Manuel Neuer','POR',8],['Antonio Rüdiger','DEF',11],['Jonathan Tah','DEF',9],['David Raum','DEF',7],['Joshua Kimmich','DEF',14],['Florian Wirtz','MED',24],['Jamal Musiala','MED',28],['Leon Goretzka','MED',10],['İlkay Gündoğan','MED',12],['Kai Havertz','DEL',16],['Leroy Sané','DEL',16],['Serge Gnabry','DEL',14],['Niclas Füllkrug','DEL',12]],
'Uruguay':[['Sergio Rochet','POR',6],['Ronald Araújo','DEF',12],['José María Giménez','DEF',9],['Mathías Olivera','DEF',7],['Sebastián Cáceres','DEF',6],['Federico Valverde','MED',24],['Manuel Ugarte','MED',10],['Giorgian de Arrascaeta','MED',14],['Rodrigo Bentancur','MED',12],['Darwin Núñez','DEL',18],['Facundo Pellistri','DEL',10],['Maxi Araújo','DEL',8]],
'Marruecos':[['Yassine Bounou','POR',8],['Achraf Hakimi','DEF',16],['Noussair Mazraoui','DEF',10],['Nayef Aguerd','DEF',8],['Romain Saïss','DEF',7],['Sofyan Amrabat','MED',10],['Azzedine Ounahi','MED',9],['Bilal El Khannouss','MED',9],['Brahim Díaz','DEL',14],['Youssef En-Nesyri','DEL',12],['Hakim Ziyech','DEL',10],['Soufiane Rahimi','DEL',8]],
'Senegal':[['Édouard Mendy','POR',7],['Kalidou Koulibaly','DEF',9],['Abdou Diallo','DEF',6],['Ismail Jakobs','DEF',6],['Idrissa Gueye','MED',8],['Pape Matar Sarr','MED',10],['Pape Gueye','MED',7],['Sadio Mané','DEL',16],['Nicolas Jackson','DEL',14],['Ismaïla Sarr','DEL',10],['Habib Diallo','DEL',8]],
'Suiza':[['Yann Sommer','POR',7],['Manuel Akanji','DEF',10],['Nico Elvedi','DEF',7],['Ricardo Rodríguez','DEF',6],['Granit Xhaka','MED',12],['Remo Freuler','MED',8],['Denis Zakaria','MED',9],['Xherdan Shaqiri','MED',8],['Breel Embolo','DEL',10],['Dan Ndoye','DEL',9],['Zeki Amdouni','DEL',8]],
'Catar':[['Meshaal Barsham','POR',4],['Boualem Khoukhi','DEF',4],['Pedro Miguel','DEF',4],['Tarek Salman','DEF',3],['Karim Boudiaf','MED',4],['Hassan Al-Haydos','MED',5],['Akram Afif','MED',8],['Almoez Ali','DEL',7],['Mohammed Muntari','DEL',4]],
'Australia':[['Mathew Ryan','POR',6],['Harry Souttar','DEF',6],['Kye Rowles','DEF',5],['Aziz Behich','DEF',4],['Jackson Irvine','MED',6],['Riley McGree','MED',5],['Connor Metcalfe','MED',4],['Mathew Leckie','DEL',6],['Mitchell Duke','DEL',5],['Kusini Yengi','DEL',5]],
'Egipto':[['Mohamed El Shenawy','POR',5],['Mohamed Abdelmonem','DEF',4],['Ahmed Hegazi','DEF',4],['Ahmed Fattouh','DEF',3],['Mohamed Elneny','MED',5],['Emam Ashour','MED',6],['Mahmoud Trezeguet','MED',8],['Mohamed Salah','DEL',28],['Omar Marmoush','DEL',16],['Mostafa Mohamed','DEL',8]],
'Estados Unidos':[['Matt Turner','POR',6],['Sergiño Dest','DEF',8],['Chris Richards','DEF',6],['Antonee Robinson','DEF',7],['Tim Ream','DEF',5],['Weston McKennie','MED',10],['Tyler Adams','MED',9],['Yunus Musah','MED',8],['Christian Pulisic','DEL',18],['Gio Reyna','DEL',12],['Folarin Balogun','DEL',12],['Tim Weah','DEL',10]],
'Corea del Sur':[['Kim Seung-gyu','POR',5],['Kim Min-jae','DEF',12],['Kim Young-gwon','DEF',5],['Kim Jin-su','DEF',4],['Hwang In-beom','MED',7],['Lee Jae-sung','MED',7],['Park Yong-woo','MED',5],['Son Heung-min','DEL',22],['Lee Kang-in','DEL',16],['Hwang Hee-chan','DEL',12],['Cho Gue-sung','DEL',8]],
'Escocia':[['Angus Gunn','POR',5],['Andrew Robertson','DEF',10],['Kieran Tierney','DEF',8],['Jack Hendry','DEF',5],['Scott McTominay','MED',12],['John McGinn','MED',10],['Billy Gilmour','MED',7],['Callum McGregor','MED',7],['Che Adams','DEL',7],['Lyndon Dykes','DEL',6],['Ben Doak','DEL',6]],
'Irán':[['Alireza Beiranvand','POR',5],['Sadegh Moharrami','DEF',4],['Shojae Khalilzadeh','DEF',4],['Milad Mohammadi','DEF',4],['Saeid Ezatolahi','MED',4],['Alireza Jahanbakhsh','MED',7],['Ali Gholizadeh','MED',5],['Mehdi Taremi','DEL',14],['Sardar Azmoun','DEL',12],['Karim Ansarifard','DEL',6]],
'Argelia':[['Raïs M’Bolhi','POR',4],['Aïssa Mandi','DEF',5],['Ramy Bensebaini','DEF',7],['Youcef Atal','DEF',6],['Ismaël Bennacer','MED',10],['Houssem Aouar','MED',8],['Nabil Bentaleb','MED',5],['Riyad Mahrez','DEL',16],['Saïd Benrahma','DEL',9],['Islam Slimani','DEL',7]],
'Austria':[['Patrick Pentz','POR',4],['David Alaba','DEF',12],['Kevin Danso','DEF',6],['Philipp Mwene','DEF',4],['Marcel Sabitzer','MED',10],['Konrad Laimer','MED',8],['Christoph Baumgartner','MED',8],['Nicolas Seiwald','MED',5],['Marko Arnautović','DEL',8],['Michael Gregoritsch','DEL',6]],
'Jordania':[['Yazeed Abulaila','POR',3],['Yazan Al-Arab','DEF',3],['Salem Al-Ajalin','DEF',3],['Noor Al-Rawabdeh','MED',4],['Mahmoud Al-Mardi','MED',3],['Mousa Al-Tamari','DEL',8],['Yazan Al-Naimat','DEL',5],['Ali Olwan','DEL',4]],
'Sudáfrica':[['Ronwen Williams','POR',5],['Siyanda Xulu','DEF',3],['Nyiko Mobbie','DEF',3],['Mothobi Mvala','DEF',3],['Teboho Mokoena','MED',6],['Themba Zwane','MED',6],['Percy Tau','DEL',8],['Lyle Foster','DEL',7]],
'Nueva Zelanda':[['Oliver Sail','POR',3],['Michael Boxall','DEF',3],['Tommy Smith','DEF',3],['Joe Bell','MED',4],['Marko Stamenic','MED',4],['Chris Wood','DEL',10],['Ben Waine','DEL',4]],
'Cabo Verde':[['Vozinha','POR',3],['Roberto Lopes','DEF',4],['Diney','DEF',3],['Jamiro Monteiro','MED',5],['Kevin Pina','MED',4],['Ryan Mendes','DEL',5],['Garry Rodrigues','DEL',5]],
'Curazao':[['Eloy Room','POR',3],['Cuco Martina','DEF',3],['Shurandy Sambo','DEF',3],['Leandro Bacuna','MED',4],['Juninho Bacuna','MED',4],['Tahith Chong','DEL',5],['Gervane Kastaneer','DEL',4]],
'Haití':[['Johny Placide','POR',3],['Ricardo Adé','DEF',3],['Carlens Arcus','DEF',3],['Danley Jean Jacques','MED',4],['Jems Geffrard','MED',3],['Frantzdy Pierrot','DEL',5],['Duckens Nazon','DEL',4]],
'Arabia Saudí':[['Mohammed Al-Owais','POR',4],['Ali Al-Bulaihi','DEF',4],['Hassan Tambakti','DEF',3],['Mohamed Kanno','MED',4],['Nasser Al-Dawsari','MED',4],['Salem Al-Dawsari','DEL',8],['Firas Al-Buraikan','DEL',6],['Saleh Al-Shehri','DEL',5]],
};

export const STR={'Brasil':92,'Argentina':93,'Francia':91,'España':90,'Alemania':86,'Inglaterra':88,'Países Bajos':85,'Uruguay':82,'Suiza':78,'Marruecos':80,'Senegal':77,'Japón':76,'Estados Unidos':74,'México':74,'Portugal':89,'Noruega':80,'Australia':70,'Egipto':71,'Irán':70,'Arabia Saudí':64,'Catar':62,'Escocia':70,'Haití':55,'Curazao':52,'Cabo Verde':56,'Argelia':72,'Austria':74,'Jordania':58,'Nueva Zelanda':60,'Sudáfrica':63,'Corea del Sur':72};
export const FLAG={'Brasil':'🇧🇷','Argentina':'🇦🇷','Francia':'🇫🇷','España':'🇪🇸','Alemania':'🇩🇪','Países Bajos':'🇳🇱','Uruguay':'🇺🇾','Suiza':'🇨🇭','Marruecos':'🇲🇦','Senegal':'🇸🇳','Japón':'🇯🇵','Estados Unidos':'🇺🇸','Australia':'🇦🇺','Egipto':'🇪🇬','Irán':'🇮🇷','Arabia Saudí':'🇸🇦','Catar':'🇶🇦','Escocia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Haití':'🇭🇹','Curazao':'🇨🇼','Cabo Verde':'🇨🇻','Argelia':'🇩🇿','Austria':'🇦🇹','Jordania':'🇯🇴','Nueva Zelanda':'🇳🇿','Sudáfrica':'🇿🇦','Corea del Sur':'🇰🇷','Noruega':'🇳🇴'};
export const TEAM_COLOR={'Brasil':'#f7d046','Argentina':'#6cace4','Francia':'#1f3a93','España':'#c8102e','Alemania':'#222','Uruguay':'#5cb1e6','Suiza':'#d52b1e','Marruecos':'#0e6b3e','Senegal':'#1c8a4a','Estados Unidos':'#2a4b9b','Egipto':'#c8102e','Australia':'#0b8a3a','Irán':'#1c8a4a','Arabia Saudí':'#137a3b','Catar':'#7a1031','Escocia':'#0a2a66','Haití':'#1c3a8a','Curazao':'#1f3a93','Cabo Verde':'#1f3a93','Argelia':'#0e6b3e','Austria':'#c8102e','Jordania':'#7a1031','Nueva Zelanda':'#222','Sudáfrica':'#0b8a3a','Corea del Sur':'#1f3a93'};

export function buildPlayers(){
  const out=[];
  for(const team in SQUADS){
    SQUADS[team].forEach(p=>{
      const id=(team+'-'+p[0]).toLowerCase().replace(/[^a-z0-9]+/g,'-');
      out.push({id,name:p[0],team,pos:p[1],price:p[2],photo:null});
    });
  }
  return out;
}
