(function () {
  "use strict";

  /* =========================================================
     1. 실제 데이터 (출처를 함께 기록)
     ========================================================= */
  var DAYS = ["일", "월", "화", "수", "목", "금", "토"];

  // 캠퍼스: 주소는 학교 홈페이지 기준. 좌표는 지도 서비스 기준의 대략값이라 '캠퍼스로 저장'으로 보정할 수 있음
  var CAMPUS = { name: "국립목포대학교 도림캠퍼스", addr: "전남 무안군 청계면 영산로 1666", lat: 34.9117, lng: 126.4373, radiusKm: 1.2 };

  // 스쿨버스 승강장: 인문대학(B15) 옆에 있다는 설명을 기준으로 개략도에 배치
  // 개략도: 학교 통학버스 시스템(mokpo.unibus.kr) 차량 위치 지도(카카오맵)에서 본 상대 위치를 바탕으로 그림. 실제 축척 아님
  // 버스 정류소(목포대정류소)는 인문대학 서쪽 큰길가, 분수대·학생회관은 남동쪽, 중앙도서관은 남쪽, 교수회관·공과대학은 북동쪽
  var STOP = { name: "목포대정류소(통학버스)", xy: [36, 118], road: [70, 118] };
  var ROAD_V = 70, ROAD_H = 166, ROAD_V2 = 250;
  var J1 = [ROAD_V, ROAD_H], J2 = [ROAD_V2, ROAD_H];

  // 건물: 코드와 이름은 학교 캠퍼스맵 기준. side는 개략도에서 건물이 붙어 있는 길 (V: 서쪽 큰길, H: 남쪽 광장길, V2: 동쪽 길)
  var BUILDINGS = {
    B15: { code: "B15", name: "인문대학", box: [92, 98, 98, 46], side: "H" },
    B17: { code: "B17", name: "교수회관", box: [146, 20, 84, 32], side: "V2" },
    ENG: { code: "", name: "공과대학", box: [262, 20, 72, 44], side: "V2" },
    C30: { code: "C30", name: "자연과학대학 1호관", box: [262, 76, 72, 34], side: "V2" },
    C31: { code: "C31", name: "자연과학대학 2호관", box: [262, 118, 72, 30], side: "V2" },
    A60: { code: "A60", name: "플라자60", box: [86, 184, 66, 30], side: "H" },
    A09: { code: "A09", name: "중앙도서관", box: [160, 190, 82, 36], side: "H" },
    A14: { code: "A14", name: "학생회관", box: [252, 184, 82, 34], side: "H" },
    A08: { code: "A08", name: "사회과학관", box: [6, 184, 56, 40], side: "V" }
  };
  var BLD_ORDER = ["ENG", "B15", "B17", "C30", "C31", "A60", "A14", "A09", "A08"];

  // 통학버스: 국립목포대 학생지원과 「2026학년도 2학기 통학버스 노선표(안)」 전체(광주권·목포권·해남권)
  // place: 등교는 승차 지점, 하교는 종착 지점 / days: 운행 요일(1=월) / fri: 금요일 출발 시각이 다를 때 / n: 차량 대수
  // eta: 출발부터 도림캠퍼스 도착까지 분. 노선표에 캠퍼스 도착 시각이 없어 마지막 정류장 시각 + 이동 시간으로 추정한 값이며 앱에서 바꿀 수 있음
  var TRIPS_DEFAULT = [{"id":"t00","area":"광주권","dir":"in","place":"염주체육관건너편육교","dep":"07:10","days":[1,2,3,4,5],"fri":null,"stops":["염주체육관건너편육교 (07:10)","서광주우체국건너편 CU편의점 (07:14)","구호남대 한마음신경정신과 (07:18)","세정아울렛버스승강장 (07:21)","구송정파출소건너편 할리매장옆승강장 (07:27)","송정역시외버스승강장 (07:30)","도림캠퍼스"],"note":"","n":1,"eta":70},{"id":"t01","area":"광주권","dir":"in","place":"금호지구중흥Ⓐ건너편승강장","dep":"07:10","days":[1,2,3,4,5],"fri":null,"stops":["금호지구중흥Ⓐ건너편승강장 (07:10)","구송정파출소건너편 할리매장옆승강장 (07:18)","선운휴먼시아버스승강장 (07:23)","도림캠퍼스"],"note":"","n":1,"eta":68},{"id":"t02","area":"광주권","dir":"in","place":"시립장애인복지관육교","dep":"07:00","days":[1,2,3,4,5],"fri":null,"stops":["시립장애인복지관육교 (07:00)","문화신협 운암지점 (07:04)","신세계백화점육교 (07:08)","추선회관 (07:10)","구호남대 한마음신경정신과 (07:14)","세정아울렛버스승강장 (07:17)","구송정파출소건너편 할리매장옆승강장 (07:20)","송정역시외버스승강장 (07:24)","도림캠퍼스"],"note":"","n":1,"eta":74},{"id":"t03","area":"광주권","dir":"in","place":"전남대정문","dep":"07:00","days":[1,2,3,4,5],"fri":null,"stops":["전남대정문 (07:00)","NC백화점 광주역점 (07:06)","평화빌딩앞 (07:11)","서구청버스승강장 (07:13)","추선회관 (07:15)","구호남대 한마음신경정신과 (07:18)","세정아울렛버스승강장 (07:20)","구송정파출소건너편 할리매장옆승강장 (07:25)","송정역시외버스승강장 (07:30)","도림캠퍼스"],"note":"","n":1,"eta":80},{"id":"t04","area":"광주권","dir":"in","place":"일곡119안전센터","dep":"06:50","days":[1,2,3,4,5],"fri":null,"stops":["일곡119안전센터 (06:50)","연제동롯데칠성승강장 (06:55)","용두주공승강장 (07:00)","광주우편집중국승강장 (07:03)","첨단응암공원승강장 (07:06)","수완2차우미린Ⓐ승강장 (07:09)","현진에버빌Ⓐ승강장 (07:10)","어등산약국 (07:13)","월곡동부영Ⓐ승강장 (07:17)","도림캠퍼스"],"note":"","n":1,"eta":82},{"id":"t05","area":"광주권","dir":"in","place":"첨단응암공원승강장","dep":"07:10","days":[1,2,3,4,5],"fri":null,"stops":["첨단응암공원승강장 (07:10)","수완2차우미린Ⓐ승강장 (07:13)","현진에버빌Ⓐ승강장 (07:14)","수완W여성병원 (07:15)","어등산약국 (07:17)","월곡동부영Ⓐ승강장 (07:21)","도림캠퍼스"],"note":"","n":1,"eta":66},{"id":"t06","area":"광주권","dir":"in","place":"남부대정문","dep":"07:00","days":[1,2,3,4,5],"fri":null,"stops":["남부대정문 (07:00)","신창동우체국 (07:05)","우미Ⓐ건너편 비아신협 (07:07)","운남주공1단지육교 KCC페인트 (07:09)","운남주공5단지육교 목련마을승강장 (07:10)","운남동 삼성아파트건너편승강장 (07:12)","월곡동부영Ⓐ승강장 (07:15)","구송정파출소건너편 할리매장옆승강장 (07:20)","송정역시외버스승강장 (07:25)","도림캠퍼스"],"note":"","n":1,"eta":75},{"id":"t07","area":"광주권","dir":"in","place":"월곡동부영Ⓐ승강장","dep":"07:15","days":[1,2,3,4,5],"fri":null,"stops":["월곡동부영Ⓐ승강장 (07:15)","광산중학교건너편승강장 (07:16)","구송정파출소건너편 할리매장옆승강장 (07:20)","송정역시외버스승강장 (07:25)","도림캠퍼스"],"note":"","n":1,"eta":60},{"id":"t08","area":"광주권","dir":"in","place":"송정역시외버스승강장","dep":"07:30","days":[1,2,3,4,5],"fri":null,"stops":["송정역시외버스승강장 (07:30)","에너지밸리캠퍼스 (08:00) · 화,수운행","무안우체국 (08:25)","도림캠퍼스"],"note":"에너지밸리","n":1,"eta":70},{"id":"t09","area":"광주권","dir":"in","place":"용두주공","dep":"09:20","days":[1,2,3,4],"fri":null,"stops":["용두주공 (09:20)","광주우편집중국승강장 (09:23)","첨단응암공원승강장 (09:28)","수완2차우미린Ⓐ승강장 (09:31)","현진에버빌Ⓐ승강장 (09:32)","수완W여성병원 (09:33)","어등산약국 (09:35)","월곡동부영Ⓐ승강장 (09:39)","광산중학교건너편승강장 (09:40)","구송정파출소건너편 할리매장옆승강장 (09:43)","송정역시외버스승강장 (09:48)","도림캠퍼스"],"note":"","n":1,"eta":78},{"id":"t10","area":"광주권","dir":"in","place":"남부대정문","dep":"09:20","days":[1,2,3,4],"fri":null,"stops":["남부대정문 (09:20)","신창동우체국 (09:25)","우미Ⓐ건너편 비아신협 (09:27)","운남주공1단지육교 KCC페인트 (09:29)","운남주공5단지육교 목련마을승강장 (09:30)","운남동 삼성아파트건너편승강장 (09:32)","월곡동부영Ⓐ승강장 (09:35)","송정역시외버스승강장 (09:45)","에너지밸리캠퍼스 (10:15) · 화,수운행","도림캠퍼스"],"note":"에너지밸리","n":1,"eta":75},{"id":"t11","area":"광주권","dir":"in","place":"문흥동샛터코아건너편 광주은행문흥지점","dep":"06:50","days":[1,2,3,4,5],"fri":null,"stops":["문흥동샛터코아건너편 광주은행문흥지점 (06:50)","문화동홈플러스건너편 (06:52)","북부소방서우산119안전센터 (06:54)","계림동E마트 (06:58)","백림약국건너편 (07:00)","산수교회건너편승강장 (07:02)","조선대건너편우측10m지점 공대방향 (07:07)","동성고육교옆 (07:20)","효천역승강장 (07:24)","호남원예고앞 (07:35)","천주교성당승강장 (07:38)","도림캠퍼스"],"note":"","n":1,"eta":88},{"id":"t12","area":"광주권","dir":"in","place":"31사단정문삼거리","dep":"06:50","days":[1,2,3,4,5],"fri":null,"stops":["31사단정문삼거리 (06:50)","오치사거리 책돌이도서관승강장 (06:52)","북구청보건소사거리 메가박스건너편경민회관 (06:55)","광주중앙교회건너편 국제열쇠 (07:00)","롯데백화점건너편 금호할인마트 (07:01)","독립로알뜰주유소 (07:03)","백운초정문 (07:05)","동성고육교옆 (07:15)","천주교성당승강장 (07:35)","도림캠퍼스"],"note":"","n":1,"eta":85},{"id":"t13","area":"광주권","dir":"in","place":"지원2동주민센터승강장 농협하나로마트","dep":"07:00","days":[1,2,3,4,5],"fri":null,"stops":["지원2동주민센터승강장 농협하나로마트 (07:00)","삼익세라믹Ⓐ정문 남광주농협앞 (07:02)","학동시장버스승강장 부흥교회앞 (07:03)","양림휴먼시아Ⓐ (07:06)","빅스포앞 (07:15)","동성고육교옆 (07:18)","효천역승강장 (07:20)","남평 탑모텔 (07:25)","천주교성당승강장 (07:35)","도림캠퍼스"],"note":"","n":1,"eta":75},{"id":"t14","area":"광주권","dir":"in","place":"LG전자베스트샵용봉점","dep":"07:00","days":[1,2,3,4,5],"fri":null,"stops":["LG전자베스트샵용봉점 (07:00)","서광주농협동운지점 (07:03)","광천파출소건너편 (07:05)","상공회의소 (07:07)","농협월산동지점 (07:09)","광주은행주월지점 (07:10)","빅스포앞 (07:13)","동성고육교옆 (07:16)","효천역승강장 (07:18)","천주교성당승강장 (07:33)","도림캠퍼스"],"note":"","n":1,"eta":73},{"id":"t15","area":"광주권","dir":"in","place":"풍암지구대주Ⓐ사거리","dep":"07:10","days":[1,2,3,4,5],"fri":null,"stops":["풍암지구대주Ⓐ사거리 (07:10)","빛가람동주민센터 (07:37)","에너지밸리캠퍼스 (07:50) · 화,수 운행","다시공영버스터미널 (07:55)","고막원광목기사식당 (08:00)","도림캠퍼스"],"note":"에너지밸리","n":1,"eta":75},{"id":"t16","area":"광주권","dir":"in","place":"동성고육교옆","dep":"07:30","days":[1,2,3,4,5],"fri":null,"stops":["동성고육교옆 (07:30)","효천역승강장 (07:32)","천주교성당승강장 (07:47)","다시공영버스터미널 (07:55)","고막원광목기사식당 (08:00)","함평역건너편 GS LPG주유소 (08:05)","도림캠퍼스"],"note":"","n":1,"eta":60},{"id":"t17","area":"광주권","dir":"in","place":"풍암지구대주Ⓐ사거리","dep":"09:10","days":[1,2,3,4],"fri":null,"stops":["풍암지구대주Ⓐ사거리 (09:10)","빅스포앞 (09:16)","동성고육교옆 (09:20)","효천역승강장 (09:22)","남평 탑모텔 (09:35)","천주교성당승강장 (09:50)","도림캠퍼스"],"note":"","n":1,"eta":80},{"id":"t18","area":"광주권","dir":"in","place":"동성고육교옆","dep":"09:30","days":[1,2,3,4],"fri":null,"stops":["동성고육교옆 (09:30)","효천역승강장 (09:32)","빛가람동주민센터 (09:47)","에너지밸리캠퍼스 (09:56) · 화,수운행","다시공영버스터미널 (10:00)","고막원광목기사식당 (10:03)","무안우체국","도림캠퍼스"],"note":"에너지밸리","n":1,"eta":58},{"id":"t19","area":"광주권","dir":"out","place":"일곡119안전센터","dep":"15:30","days":[1,2,3,4],"fri":null,"stops":["송정역","구송정파출소","광산중학교","월곡동부영Ⓐ","어등산약국","수완W여성병원","현진에버빌Ⓐ","수완2차우미린Ⓐ","첨단응암공원","광주우편집중국승강장","용두주공","연제동롯데칠성","일곡119안전센터"],"note":"","n":1,"eta":null},{"id":"t20","area":"광주권","dir":"out","place":"용두주공","dep":"16:30","days":[1,2,3,4,5],"fri":null,"stops":["에너지밸리캠퍼스 (17:05) · 화,수운행","송정역","광산중학교","월곡동부영Ⓐ","어등산약국","수완W여성병원","첨단응암공원","광주우편집중국승강장","용두주공 * 운전원은 에너지밸리캠퍼스 탑승 인원을 감안하여 좌석 확보"],"note":"에너지밸리 화,수 운행","n":1,"eta":null},{"id":"t21","area":"광주권","dir":"out","place":"풍암지구대주Ⓐ사거리","dep":"17:30","days":[1,2,3,4,5],"fri":"15:30","stops":["서광주우체국","염주체육관","금호지구중흥Ⓐ","풍암지구대주Ⓐ사거리"],"note":"","n":1,"eta":null},{"id":"t22","area":"광주권","dir":"out","place":"LG전자베스트샵용봉점","dep":"17:30","days":[1,2,3,4,5],"fri":"15:30","stops":["송정역","구송정파출소","세정아울렛건너편","구호남대","추선회관","광진빌딩(양동초입구)","NC백화점광주역점","전남대정문","LG전자베스트샵용봉점"],"note":"","n":1,"eta":null},{"id":"t23","area":"광주권","dir":"out","place":"남부대","dep":"17:30","days":[1,2,3,4,5],"fri":"15:30","stops":["무안우체국","삼성아파트","신가주공5단지","신가주공1단지","신가사거리","신창동우체국","남부대"],"note":"","n":1,"eta":null},{"id":"t24","area":"광주권","dir":"out","place":"용두주공","dep":"17:30","days":[1,2,3,4,5],"fri":"15:30","stops":["광산중학교","월곡동부영Ⓐ","어등산약국","수완W여성병원","현진에버빌Ⓐ","수완2차우미린Ⓐ","첨단응암공원","광주우편집중국승강장","용두주공"],"note":"","n":1,"eta":null},{"id":"t25","area":"광주권","dir":"out","place":"풍암지구대주Ⓐ사거리","dep":"18:20","days":[1,2,3,4,5],"fri":null,"stops":["서광주우체국","염주체육관","금호지구중흥Ⓐ","풍암지구대주Ⓐ사거리"],"note":"","n":1,"eta":null},{"id":"t26","area":"광주권","dir":"out","place":"용두주공","dep":"18:20","days":[1,2,3,4,5],"fri":null,"stops":["광산중학교","월곡동부영Ⓐ","어등산약국","수완W여성병원","첨단응암공원","광주우편집중국승강장","용두주공"],"note":"","n":1,"eta":null},{"id":"t27","area":"광주권","dir":"out","place":"남부대","dep":"18:20","days":[1,2,3,4,5],"fri":null,"stops":["무안우체국","삼성아파트","신가주공5단지","신가주공1단지","신가사거리","신창동우체국","남부대"],"note":"","n":1,"eta":null},{"id":"t28","area":"광주권","dir":"out","place":"LG전자베스트샵용봉점","dep":"18:20","days":[1,2,3,4,5],"fri":null,"stops":["송정역","구송정파출소","세정아울렛건너편","구호남대","추선회관","광진빌딩(양동초입구)","NC백화점광주역점","전남대정문","LG전자베스트샵용봉점"],"note":"","n":1,"eta":null},{"id":"t29","area":"광주권","dir":"out","place":"용두주공","dep":"21:00","days":[1,2,3,4],"fri":null,"stops":["송정역","구송정파출소","광산중학교","월곡동부영Ⓐ","어등산약국","수완W여성병원","첨단응암공원","광주우편집중국승강장","용두주공"],"note":"(야간)","n":1,"eta":null},{"id":"t30","area":"광주권","dir":"out","place":"문흥동샛터코아","dep":"15:30","days":[1,2,3,4],"fri":null,"stops":["천주교성당","탑 모텔","효천역","남광주농협진월동지점","조선대","산수오거리","백림약국","동신고","북광주전화국","문흥동샛터코아"],"note":"","n":1,"eta":null},{"id":"t31","area":"광주권","dir":"out","place":"동림센타","dep":"16:30","days":[1,2,3,4,5],"fri":null,"stops":["에너지밸리캠퍼스 (17:05) · 화,수운행","천주교성당","호남원예고","빛가람동주민센터","효천역","동성고육교","대광여고","신우아파트","상공회의소","신세계백화점","광천파출소","운암주공3단지Ⓐ","동림센터 * 운전원은 에너지밸리캠퍼스 탑승 인원을 감안하여 좌석 확보"],"note":"에너지밸리 화,수 운행","n":1,"eta":null},{"id":"t32","area":"광주권","dir":"out","place":"문흥동샛터코아","dep":"17:30","days":[1,2,3,4,5],"fri":"15:30","stops":["천주교성당","탑 모텔","효천역","남광주농협진월동지점","조선대","산수오거리","백림약국","동신고","북광주전화국","문흥동샛터코아"],"note":"","n":1,"eta":null},{"id":"t33","area":"광주권","dir":"out","place":"일곡병원","dep":"17:30","days":[1,2,3,4,5],"fri":"15:30","stops":["고막원 광목기사식당 건너편 횡단보도","다시공영버스터미널","빛가람동주민센터","효천역","남광주농협진월동지점","백운광장","독립로알뜰주유소건너편","한미쇼핑","구터미널","한국화장품","북구청","한국전력공사","31사단정문","일곡병원"],"note":"","n":1,"eta":null},{"id":"t34","area":"광주권","dir":"out","place":"문흥동샛터코아","dep":"18:20","days":[1,2,3,4,5],"fri":null,"stops":["함평역","천주교성당","지원동삼영예식장","삼익세라믹Ⓐ","학동시장","조선대","산수오거리","백림약국","동신고","북광주전화국","문흥동샛터코아"],"note":"","n":1,"eta":null},{"id":"t35","area":"광주권","dir":"out","place":"일곡119안전센터","dep":"18:20","days":[1,2,3,4,5],"fri":null,"stops":["천주교성당","효천역","남광주농협진월동지점","대광여고","백운광장","독립로알뜰주유소건너편","한미쇼핑","구터미널","한국화장품","북구청","한국전력공사","31사단정문","일곡119안전센터"],"note":"","n":1,"eta":null},{"id":"t36","area":"광주권","dir":"out","place":"동림센타","dep":"18:20","days":[1,2,3,4,5],"fri":null,"stops":["고막원 광목기사식당 건너편 횡단보도","다시공영버스터미널","빛가람동주민센터","탑 모텔","신우Ⓐ","구동강한의원","상공회의소","신세계백화점","광천파출소","운암주공3단지Ⓐ","동림센터"],"note":"","n":1,"eta":null},{"id":"t37","area":"광주권","dir":"out","place":"남광주농협진월동지점","dep":"21:00","days":[1,2,3,4],"fri":null,"stops":["무안우체국","고막원 광목기사식당 건너편 횡단보도","다시공영버스터미널","천주교성당","빛가람동주민센터","탑 모텔","효천역","남광주농협진월동지점"],"note":"(야간)","n":1,"eta":null},{"id":"t38","area":"목포권","dir":"in","place":"대성초건너편승강장","dep":"08:00","days":[1,2,3,4,5],"fri":null,"stops":["대성초건너편승강장 (08:00)","보건소사거리","신안비치Ⓐ1차건너편 T´Station(타이어)","연산동현대산업개발Ⓐ","서해안장례식장건너편승강장","용해동골드클래스705동앞","포미타운105동건너편","도림캠퍼스"],"note":"월~목 증차","n":3,"eta":35},{"id":"t39","area":"목포권","dir":"in","place":"용해동골드클래스705동앞","dep":"08:15","days":[1,2,3,4,5],"fri":null,"stops":["용해동골드클래스705동앞 (08:15)","포미타운105동건너편","도림캠퍼스"],"note":"","n":1,"eta":20},{"id":"t40","area":"목포권","dir":"in","place":"대성초건너편승강장","dep":"09:20","days":[1,2,3,4,5],"fri":null,"stops":["대성초건너편승강장 (09:20)","보건소사거리","신안비치Ⓐ1차건너편 T´Station(타이어)","연산동현대산업개발Ⓐ","서해안장례식장건너편승강장","도림캠퍼스"],"note":"","n":1,"eta":35},{"id":"t41","area":"목포권","dir":"in","place":"용해동골드클래스705동앞","dep":"09:30","days":[1,2,3,4,5],"fri":null,"stops":["용해동골드클래스705동앞 (09:30)","포미타운105동건너편","도림캠퍼스"],"note":"","n":1,"eta":20},{"id":"t42","area":"목포권","dir":"in","place":"신안병원건너편","dep":"08:00","days":[1,2,3,4,5],"fri":null,"stops":["신안병원건너편 (08:00)","목포역한국은행건너편","구연동육교 민안경원","2호광장 서울갈비","MBC방송국","버스터미널건너편 시내버스승강장","석현동버스승강장","도림캠퍼스"],"note":"","n":1,"eta":40},{"id":"t43","area":"목포권","dir":"in","place":"버스터미널건너편 시내버스승강장","dep":"08:15","days":[1,2,3,4,5],"fri":null,"stops":["버스터미널건너편 시내버스승강장 (08:15)","석현동버스승강장","도림캠퍼스"],"note":"","n":1,"eta":20},{"id":"t44","area":"목포권","dir":"in","place":"용해동 신안인스빌승강장","dep":"08:10","days":[1,2,3,4,5],"fri":null,"stops":["용해동 신안인스빌승강장 (08:10)","하당 청담유성형외과","장난감할인마트앞승강장","석현동버스승강장","도림캠퍼스"],"note":"월~목 증차","n":3,"eta":25},{"id":"t45","area":"목포권","dir":"in","place":"용해동 신안인스빌승강장","dep":"09:20","days":[1,2,3,4,5],"fri":null,"stops":["용해동 신안인스빌승강장 (09:20)","하당 청담유성형외과","장난감할인마트앞승강장","석현동버스승강장","도림캠퍼스"],"note":"","n":1,"eta":25},{"id":"t46","area":"목포권","dir":"in","place":"옥암주공 승강장","dep":"08:10","days":[1,2,3,4,5],"fri":null,"stops":["옥암주공 승강장(시민문화체육센터 건너편)","LG베스트샵 앞 승강장(전라남도보훈회관 건너편)","오룡주공 승강장(전라남도체육회관 건너편)","도청프라자 승강장(도청, 만남의광장건너편)","근화베아체 승강장(전라남도교육청 건너편)","남악애시앙 승강장","도림캠퍼스"],"note":"월~목 증차","n":2,"eta":25},{"id":"t47","area":"목포권","dir":"in","place":"도청프라자 승강장","dep":"08:15","days":[1,2,3,4,5],"fri":null,"stops":["도청프라자 승강장(도청, 만남의광장건너편)","근화베아체 승강장(전라남도교육청 건너편)","남악애시앙 승강장","도림캠퍼스"],"note":"","n":1,"eta":15},{"id":"t48","area":"목포권","dir":"in","place":"옥암주공 승강장","dep":"09:20","days":[1,2,3,4,5],"fri":null,"stops":["옥암주공 승강장(시민문화체육센터 건너편)","LG베스트샵 앞 승강장(전라남도보훈회관 건너편)","오룡주공 승강장(전라남도체육회관 건너편)","도청프라자 승강장(도청, 만남의광장건너편)","근화베아체 승강장(전라남도교육청 건너편)","남악애시앙 승강장","도림캠퍼스"],"note":"","n":1,"eta":25},{"id":"t49","area":"목포권","dir":"in","place":"제일풍경채리버파크105동앞","dep":"08:00","days":[1,2,3,4,5],"fri":null,"stops":["제일풍경채리버파크105동앞 (08:00)","호반써밋오룡2차Ⓐ204동앞","오룡푸르지오1단지(103동 하천건너 큰도로변)","오룡중흥S클래스승강장(103동건너편)","오룡푸르지오파르세나105동앞","남악센트레빌리버파크승강장(120동 건너편)","빅스토어식자재마트앞 승강장","남악펠리시티3차건너편 승강장(맥도날드옆)","도청프라자 승강장(도청, 만남의광장건너편)","근화베아체 승강장(전라남도교육청 건너편)","남악애시앙 승강장","도림캠퍼스"],"note":"","n":1,"eta":35},{"id":"t50","area":"목포권","dir":"out","place":"신안병원","dep":"16:40","days":[1,2,3,4,5],"fri":null,"stops":["도림캠퍼스","석현동인성학교","버스터미널","홈플러스","2호광장","구연동육교","목포역","신안병원"],"note":"","n":2,"eta":null},{"id":"t51","area":"목포권","dir":"out","place":"대성초","dep":"16:40","days":[1,2,3,4,5],"fri":null,"stops":["도림캠퍼스","포미타운105동","용해동골드클래스705동앞","서해안장래식장승강장","연산동현대산업개발Ⓐ","신안비치Ⓐ1차","보건소사거리","대성초"],"note":"","n":2,"eta":null},{"id":"t52","area":"목포권","dir":"out","place":"용해동신안인스빌","dep":"16:40","days":[1,2,3,4,5],"fri":null,"stops":["도림캠퍼스","목포이비인후과","동신대학교목포한방병원","용해동신안인스빌"],"note":"월~목 증차","n":2,"eta":null},{"id":"t53","area":"목포권","dir":"out","place":"전남도교육청오룡지구","dep":"16:40","days":[1,2,3,4],"fri":null,"stops":["남악애시앙 승강장 건너편","전라남도교육청 승강장","남악중앙시장 승강장","동부센트레빌승강장","오룡푸르지오파르세나 승강장","오룡중흥S클래스승강장","오룡푸르지오1단지(103동 건너편)","호반써밋오룡2차Ⓐ204동 건너편","제일풍경채리버파크105동 건너편"],"note":"","n":1,"eta":null},{"id":"t54","area":"목포권","dir":"out","place":"남악애시앙승강장","dep":"16:40","days":[1,2,3,4,5],"fri":null,"stops":["도림캠퍼스","옥암주공 승강장","LG베스트샵 앞 승강장","오룡주공 승강장","도청프라자 승강장","근화베아체 승강장","남악애시앙 승강장"],"note":"","n":1,"eta":null},{"id":"t55","area":"목포권","dir":"out","place":"용해동신안인스빌","dep":"18:10","days":[1,2,3,4,5],"fri":null,"stops":["도림캠퍼스","목포이비인후과","동신대학교목포한방병원","용해동신안인스빌"],"note":"","n":2,"eta":null},{"id":"t56","area":"목포권","dir":"out","place":"남악애시앙승강장","dep":"18:10","days":[1,2,3,4,5],"fri":null,"stops":["도림캠퍼스","옥암주공 승강장","LG베스트샵 앞 승강장","오룡주공 승강장","도청프라자 승강장","근화베아체 승강장","남악애시앙 승강장"],"note":"","n":1,"eta":null},{"id":"t57","area":"목포권","dir":"out","place":"남악오룡푸르지오","dep":"18:10","days":[1,2,3,4,5],"fri":null,"stops":["남악애시앙 승강장 건너편","전라남도교육청 승강장","전남도청 승강장","남악펠리시티3차 회룡마을 승강장","남악중앙시장 승강장","동부센트레빌승강장","오룡푸르지오파르세나 승강장","오룡중흥S클래스승강장","오룡푸르지오1단지(103동 건너편)","호반써밋오룡2차Ⓐ204동 건너편","제일풍경채리버파크105동 건너편"],"note":"","n":1,"eta":null},{"id":"t58","area":"목포권","dir":"out","place":"대성초","dep":"18:10","days":[1,2,3,4,5],"fri":null,"stops":["도림캠퍼스","포미타운105동","용해동골드클래스705동앞","서해안장래식장승강장","연산동현대산업개발Ⓐ","신안비치Ⓐ1차","보건소사거리","대성초"],"note":"","n":2,"eta":null},{"id":"t59","area":"목포권","dir":"out","place":"신안병원","dep":"18:10","days":[1,2,3,4,5],"fri":null,"stops":["도림캠퍼스","석현동인성학교","버스터미널","홈플러스","2호광장","구연동육교","목포역","신안병원"],"note":"","n":1,"eta":null},{"id":"t60","area":"목포권","dir":"out","place":"목포시외버스터미널","dep":"12:10","days":[1,2,3,4],"fri":null,"stops":["도림캠퍼스","석현동 인성학교","목포시외버스터미널(온누리약국앞)"],"note":"","n":1,"eta":null},{"id":"t61","area":"목포권","dir":"in","place":"목포시외버스터미널","dep":"12:30","days":[1,2,3,4],"fri":null,"stops":["목포시외버스터미널(버스터미널 방향 온누리약국 앞)","석현동 버스승강장","도림캠퍼스"],"note":"","n":1,"eta":20},{"id":"t62","area":"해남권","dir":"in","place":"남향예식장 해남터미널건너편","dep":"07:00","days":[1,2,3,4,5],"fri":null,"stops":["남향예식장 해남터미널건너편 (07:00)","옥천농협 (07:02)","강진터미널 (07:20)","성전터미널 (07:30)","영암향군회관버스정류장 (07:45)","독천부산식당앞 (08:00)","삼호보건지소건너편큰도로변 (08:05)","인공폭포 승강장 (08:10)","도림캠퍼스"],"note":"","n":1,"eta":95},{"id":"t63","area":"해남권","dir":"out","place":"해남터미널","dep":"18:00","days":[1,2,3,4,5],"fri":null,"stops":["사랑의교회 승강장","삼호보건지소큰도로변","독천 부산식당","영암향군회관","성전터미널","강진터미널","옥천농협","해남터미널"],"note":"","n":1,"eta":null}];
  var AREAS = ["목포권", "광주권", "해남권"];
  var BUS_BASIS = "2026학년도 2학기 통학버스 노선표(안) 기준";
  var BUS_NOTICE = "노선과 출발 시간은 날씨·탑승 인원 등에 따라 조정될 수 있어요. 문의: 학생지원과 061-450-2033";
  var OTHER_TRANSIT = [
    { name: "210번 시내버스", note: "캠퍼스 안을 지나는 노선. 학내 승강장이 2025년 11월에 바뀌었어요." },
    { name: "240-1번 농어촌버스(무안군)", note: "무안터미널 ↔ 청계, '목포대학교' 정류장에 서요." },
    { name: "금호 고속버스 목포↔광주", note: "도림캠퍼스를 경유해요." }
  ];

  var SAMPLE_TIMETABLE = [
    { name: "웹프로그래밍", day: 1, start: "09:00", end: "10:15", bld: "ENG", room: "302", memo: "" },
    { name: "통계학", day: 1, start: "10:30", end: "11:45", bld: "C30", room: "105", memo: "" },
    { name: "글쓰기와 표현", day: 1, start: "13:30", end: "14:45", bld: "B15", room: "201", memo: "" },
    { name: "HCI 개론", day: 2, start: "10:30", end: "11:45", bld: "ENG", room: "508", memo: "" },
    { name: "웹프로그래밍", day: 3, start: "09:00", end: "10:15", bld: "ENG", room: "302", memo: "" },
    { name: "통계학", day: 3, start: "10:30", end: "11:45", bld: "C30", room: "105", memo: "" },
    { name: "캡스톤디자인", day: 4, start: "13:00", end: "15:45", bld: "ENG", room: "407", memo: "" },
    { name: "경영학원론", day: 5, start: "09:00", end: "10:15", bld: "A08", room: "210", memo: "" }
  ];

  var PRESETS = [
    { label: "월 07:50 등교 준비", day: 1, min: 470 },
    { label: "월 08:13 통학버스 놓침", day: 1, min: 493 },
    { label: "월 10:16 연강 이동", day: 1, min: 616 },
    { label: "월 15:00 수업 끝, 하교", day: 1, min: 900 }
  ];

  /* =========================================================
     2. 상태와 저장
     ========================================================= */
  function load(k, f) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경 */ } }
  // 처음 열 때: 평일 07~19시면 실제 시각, 그 밖에는 등교 장면을 보여 주는 데모 시각
  function firstMode() { var d = new Date(), h = d.getHours(); return d.getDay() >= 1 && d.getDay() <= 5 && h >= 7 && h < 19 ? "real" : "demo"; }
  function withIds(list) { return list.map(function (c, i) { return Object.assign({ id: "c" + Date.now().toString(36) + i }, c); }); }

  var state = {
    timetable: load("mnu_timetable", null) || withIds(SAMPLE_TIMETABLE),
    trips: load("mnu_trips_2026_2", null) || JSON.parse(JSON.stringify(TRIPS_DEFAULT)),
    settings: Object.assign({ mode: firstMode(), day: 1, min: 470, big: false, loc: "auto", myArea: "목포권", myBoard: "옥암주공 승강장", myDest: "남악애시앙승강장", useGeo: false }, load("mnu_settings", {})),
    busArea: null, editingTrip: null,
    campus: Object.assign({}, CAMPUS, load("mnu_campus", {})),
    geo: { status: "idle", dist: null },
    tab: "today", stepsDone: {}, arrived: null, editingId: null, editingRoute: null
  };
  function saveSettings() { save("mnu_settings", state.settings); }
  // 예전 예시 과목명(UX/UI 디자인)이 저장돼 있으면 새 예시 과목명으로 바꿈
  state.timetable.forEach(function (c) { if (c.name === "UX/UI 디자인") c.name = "웹프로그래밍"; });

  /* =========================================================
     3. 유틸
     ========================================================= */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  function toMin(s) { var p = String(s).split(":"); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function floorOf(room) { var f = parseInt(String(room).charAt(0), 10); return isNaN(f) ? 1 : f; }
  function insideMin(room) { return floorOf(room) <= 1 ? 1 : 2; }
  function center(b) { return [b.box[0] + b.box[2] / 2, b.box[1] + b.box[3] / 2]; }
  function walkBetween(a, b) {
    if (a === b) return 0;
    var pts = pathPoints(a, b), d = 0;
    for (var i = 1; i < pts.length; i++) d += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
    return Math.max(1, Math.round(d / 60)); // 개략도 60px ≈ 도보 1분(추정)
  }
  function walkFromStop(b) { return walkBetween("STOP", b); }
  function bName(code) { var b = BUILDINGS[code]; return b ? b.name : code; }
  function bLabel(code) { var b = BUILDINGS[code]; return b ? (b.code ? b.name + "(" + b.code + ")" : b.name) : code; }
  function statusOf(s) {
    if (s >= 10) return { cls: "ok", ico: "✓", label: "여유" };
    if (s >= 3) return { cls: "warn", ico: "!", label: "빠듯" };
    if (s >= 0) return { cls: "warn", ico: "!", label: "아슬아슬" };
    return { cls: "bad", ico: "✕", label: "지각 위험" };
  }
  function slackText(s) { return s >= 0 ? "여유 " + s + "분" : (-s) + "분 늦음"; }
  function dur(m) { return m >= 90 ? "<b>" + Math.floor(m / 60) + "</b>시간 <b>" + (m % 60) + "</b>분" : "<b>" + m + "</b>분"; }
  function isWeekday(d) { return d >= 1 && d <= 5; }
  function tripById(id) { return state.trips.filter(function (t) { return t.id === id; })[0]; }
  function depOn(t, day) { return day === 5 && t.fri ? t.fri : t.dep; }
  function runsOn(t, day) { return t.days.indexOf(day) >= 0; }
  function tripsFor(area, dir, day) {
    return state.trips.filter(function (t) { return t.area === area && t.dir === dir && (day == null || runsOn(t, day)); })
      .sort(function (a, b) { return toMin(day == null ? a.dep : depOn(a, day)) - toMin(day == null ? b.dep : depOn(b, day)); });
  }
  function isMine(t) { return t.area === state.settings.myArea && (t.dir === "in" ? t.place === state.settings.myBoard : t.place === state.settings.myDest); }
  function daysLabel(t) { return t.days.length === 5 ? (t.fri ? "평일 · 금 " + t.fri : "평일") : "월~목"; }
  function saveTrips() { save("mnu_trips_2026_2", state.trips); }

  // 학교 통학버스 시스템(mokpo.unibus.kr)의 노선 번호(lineId). 노선 및 정거장 페이지에서 확인한 값
  var UNIBUS = "https://mokpo.unibus.kr/";
  var UNIBUS_LOCATION = UNIBUS + "#!/bus-location";
  // [지역, 방향, 출발, 승차 지점 키워드, lineId, 학교 시스템의 노선 이름]
  var UNIBUS_LINES = [
    ["목포권", "in", "08:00", "대성초", 37, "목01_대성초건너편승강장_08:00"], ["목포권", "in", "08:15", "골드클래스", 39, "목04_용해동골드클래스705동앞_08:15"],
    ["목포권", "in", "09:20", "대성초", 41, "목05_대성초건너편승강장_09:20"], ["목포권", "in", "09:30", "골드클래스", 40, "목06_용해동골드클래스705동앞_09:30"],
    ["목포권", "in", "08:00", "신안병원", 42, "목07_신안병원건너편_08:00"], ["목포권", "in", "08:15", "버스터미널", 43, "목08_버스터미널건너편시내버스승강장08:15"],
    ["목포권", "in", "08:10", "신안인스빌", 45, "목09_용해동신안인스빌_08:10"], ["목포권", "in", "09:20", "신안인스빌", 46, "목12_용해동신안인스빌_09:20"],
    ["목포권", "in", "08:10", "옥암주공", 49, "목13_옥암주공승강장_08:10"], ["목포권", "in", "08:15", "도청프라자", 50, "목15_도청프라자 승강장_08:15"],
    ["목포권", "in", "09:20", "옥암주공", 51, "목16_옥암주공승강장_09:20"], ["목포권", "in", "08:00", "제일풍경채", 52, "목17_제일풍경채리버파크_08:00"],
    ["목포권", "in", "12:30", "목포시외버스터미널", 143, "목포시외버스터미널_12:30"],
    ["광주권", "in", "07:10", "염주체육관", 1, "송01_염주체육관건너편육교_07:10"], ["광주권", "in", "07:10", "금호지구", 2, "송02_금호지구_중흥Ⓐ_07:10"],
    ["광주권", "in", "07:00", "시립장애인", 3, "송03_시립장애인복지관_07:00"], ["광주권", "in", "07:00", "전남대정문", 4, "송04_전남대정문_07:00"],
    ["광주권", "in", "06:50", "일곡119", 6, "송05_일곡119안전센터_06:50"], ["광주권", "in", "07:10", "첨단응암", 7, "송06_첨단응암공원승강장_07:10"],
    ["광주권", "in", "07:00", "남부대", 8, "송07_남부대정문_07:00"], ["광주권", "in", "07:15", "월곡동", 9, "송08_월곡동부영Ⓐ승강장_07:15"],
    ["광주권", "in", "07:30", "송정역", 10, "송09_송정역시외버스승강장_07:30"], ["광주권", "in", "09:20", "용두주공", 11, "송10_용두주공_09:20"],
    ["광주권", "in", "09:20", "남부대", 80, "송11_남부대정문_09:20"], ["광주권", "in", "06:50", "문흥동", 12, "진01_문흥동샛터코아_06:50"],
    ["광주권", "in", "06:50", "31사단", 5, "진02_31사단정문삼거리_06:50"], ["광주권", "in", "07:00", "지원2동", 13, "진03_지원2동주민센터_07:00"],
    ["광주권", "in", "07:00", "LG전자베스트샵", 14, "진04_LG전자베스트샵용봉_07:00"], ["광주권", "in", "07:10", "풍암지구", 15, "진05_풍암지구대주Ⓐ사거리_07:10"],
    ["광주권", "in", "07:30", "동성고", 16, "진06_동성고육교옆_07:30"], ["광주권", "in", "09:10", "풍암지구", 17, "진07_풍암지구대주Ⓐ사거리_09:10"],
    ["광주권", "in", "09:30", "동성고", 81, "진08_동성고육교옆_09:30"], ["광주권", "out", "17:30", "문흥동", 31, "진23_문흥동샛터코아_17:30"],
    ["광주권", "out", "17:30", "일곡병원", 32, "진24_일곡병원_17:30"], ["해남권", "in", "07:00", "해남", 70, "해남01_해남터미널남향예식장_07:00"]
  ];
  function unibusHit(t) { return UNIBUS_LINES.filter(function (l) { return l[0] === t.area && l[1] === t.dir && l[2] === t.dep && t.place.indexOf(l[3]) >= 0; })[0] || null; }
  function unibusLine(t) { var hit = unibusHit(t); return hit ? UNIBUS + "#!/bus-location-detail?lineId=" + hit[4] : null; }
  function lineLinks(t, small) {
    var hit = unibusHit(t), url = hit ? unibusLine(t) : UNIBUS_LOCATION, cls = small ? "mini link" : "btn ghost sm";
    return '<a class="' + cls + '" href="' + url + '" target="_blank" rel="noopener">학교 시스템에서 위치 보기 ↗</a>' +
      (hit ? '<span class="hint">첫 화면이 로그인이면 ‘차량위치 조회’ → <b>' + esc(hit[5]) + "</b></span>" : '<span class="hint">첫 화면에서 ‘차량위치 조회’를 누르세요</span>');
  }

  function now() {
    if (state.settings.mode === "real") { var d = new Date(); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() }; }
    return { day: state.settings.day, min: state.settings.min };
  }
  function classesOn(day) { return state.timetable.filter(function (c) { return c.day === day; }).sort(function (a, b) { return toMin(a.start) - toMin(b.start); }); }


  /* =========================================================
     4. 계산
     ========================================================= */
  function context(n) {
    var today = classesOn(n.day), current = null, next = null, prev = null, offset = 0;
    today.forEach(function (c) {
      var s = toMin(c.start), e = toMin(c.end);
      if (s <= n.min && n.min < e) current = c;
      if (e <= n.min) prev = c;
      if (!next && s > n.min) next = c;
    });
    if (!next) for (var d = 1; d <= 7 && !next; d++) { var l = classesOn((n.day + d) % 7); if (l.length) { next = l[0]; offset = d; } }
    var auto = "bus";
    if (offset === 0) {
      if (current) auto = current.bld;
      else if (prev && n.min - toMin(prev.end) <= 90) auto = prev.bld;
      else if (state.settings.useGeo && state.geo.status === "on") auto = "STOP";
    }
    if (state.settings.useGeo && state.geo.status === "off" && !current) auto = "bus";
    var loc = state.settings.loc === "auto" ? auto : state.settings.loc;
    if (offset > 0) loc = "bus";
    return { current: current, next: next, prev: prev, offset: offset, origin: loc, auto: auto, todayDone: offset > 0 && today.length > 0 && !current };
  }

  function plan(ctx, n) {
    var c = ctx.next, start = toMin(c.start), inside = insideMin(c.room), walk;
    if (ctx.origin === "bus") {
      walk = walkFromStop(c.bld);
      var day = (n.day + ctx.offset) % 7;
      if (!isWeekday(day)) return { type: "bus", trips: [], noService: true, walk: walk, inside: inside };
      var all = tripsFor(state.settings.myArea, "in", day).map(function (t) {
        var dep = toMin(depOn(t, day)), arr = dep + t.eta + walk + inside;
        return { trip: t, dep: dep, arr: arr, slack: start - arr, mine: isMine(t) };
      });
      var upcoming = ctx.offset === 0 ? all.filter(function (t) { return t.dep >= n.min; }) : all;
      var useful = upcoming.filter(function (t) { return t.slack > -30 && t.slack <= 45; });
      var mine = upcoming.filter(function (t) { return t.mine && t.slack >= 0; }).sort(function (a, b) { return b.dep - a.dep; })[0]
        || upcoming.filter(function (t) { return t.mine; })[0] || null;
      var best = upcoming.filter(function (t) { return t.slack >= 0; }).sort(function (a, b) { return b.dep - a.dep; })[0] || null;
      // 보여 줄 버스: 내 노선 → 늦지 않는 마지막 버스 → 나머지(출발 순), 최대 4대
      var pick = [];
      [mine, best].concat(useful).forEach(function (t) { if (t && pick.indexOf(t) < 0 && pick.length < 4) pick.push(t); });
      if (!pick.length && upcoming.length) pick.push(upcoming[0]);
      pick.sort(function (a, b) { return a.dep - b.dep; });
      var hadMine = all.some(function (t) { return t.mine; });
      return { type: "bus", trips: pick, mine: mine, best: best, walk: walk, inside: inside, missedMine: ctx.offset === 0 && hadMine && (!mine || mine.slack < 0), day: day };
    }
    walk = ctx.origin === "STOP" ? walkFromStop(c.bld) : walkBetween(ctx.origin, c.bld);
    var total = walk + inside, arr = n.min + total;
    return { type: "walk", walk: walk, inside: inside, total: total, arr: arr, slack: start - arr, leaveBy: start - total - 3 };
  }

  function haversine(a, b, c, d) {
    var R = 6371, toR = Math.PI / 180, dLat = (c - a) * toR, dLng = (d - b) * toR;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a * toR) * Math.cos(c * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  /* =========================================================
     5. 상단: 시각·위치
     ========================================================= */
  var el = function (id) { return document.getElementById(id); };

  function renderTop() {
    var n = now();
    el("clockText").textContent = DAYS[n.day] + " " + fmt(n.min);
    el("modeTag").textContent = state.settings.mode === "real" ? "실제" : "데모";
    el("modeDemo").setAttribute("aria-pressed", String(state.settings.mode === "demo"));
    el("modeReal").setAttribute("aria-pressed", String(state.settings.mode === "real"));
    el("demoFields").style.display = state.settings.mode === "demo" ? "" : "none";
    el("demoDay").value = String(state.settings.day);
    el("demoTime").value = fmt(state.settings.min);

    document.documentElement.classList.toggle("big", !!state.settings.big);
    el("bigBtn").setAttribute("aria-pressed", String(!!state.settings.big));
    var g = state.geo, dot = el("locDot"), txt = el("locText"), sub = el("locSub"), msg = el("locMsg");
    dot.className = "loc-dot";
    el("locSave").hidden = !(g.status === "on" || g.status === "off");
    el("locClear").hidden = !state.settings.useGeo;
    if (!state.settings.useGeo || g.status === "idle") { txt.textContent = "위치"; sub.textContent = "아직 확인하지 않았어요"; }
    else if (g.status === "loading") { txt.textContent = "확인 중"; sub.textContent = "위치를 확인하고 있어요"; }
    else if (g.status === "on") { dot.className += " on"; txt.textContent = "캠퍼스 안"; sub.textContent = "캠퍼스 중심에서 약 " + g.dist.toFixed(1) + "km"; msg.textContent = "캠퍼스 안에 있어요. 직전 수업이 없으면 목포대정류소에서 출발한다고 보고 계산해요."; }
    else if (g.status === "off") { dot.className += " off"; txt.textContent = g.dist.toFixed(1) + "km"; sub.textContent = "캠퍼스까지 직선 약 " + g.dist.toFixed(1) + "km"; msg.textContent = "캠퍼스 밖에 있어요. 통학버스를 타는 것으로 계산해요. 실제로 캠퍼스 안인데 이렇게 보이면 '지금 위치를 캠퍼스로 저장'을 눌러 보정하세요."; }
    else { dot.className += " err"; txt.textContent = "위치 꺼짐"; sub.textContent = g.message || "위치를 가져오지 못했어요"; msg.textContent = (g.message || "") + " 출발지는 '오늘' 화면에서 직접 고를 수 있어요."; }
  }

  function requestGeo() {
    state.settings.useGeo = true; saveSettings();
    if (!("geolocation" in navigator)) { state.geo = { status: "error", message: "이 브라우저는 위치 기능을 지원하지 않아요." }; render(); return; }
    state.geo = { status: "loading" }; renderTop();
    try {
      navigator.geolocation.getCurrentPosition(function (pos) {
        var d = haversine(pos.coords.latitude, pos.coords.longitude, state.campus.lat, state.campus.lng);
        state.geo = { status: d <= state.campus.radiusKm ? "on" : "off", dist: d, lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.arrived = null; render();
      }, function (err) {
        var m = err && err.code === 1 ? "위치 권한이 거부되었어요. 이 화면(미리보기)에서는 위치가 막혀 있을 수 있어요. 배포된 웹 주소에서 다시 시도하세요." : "위치를 가져오지 못했어요.";
        state.geo = { status: "error", message: m }; render();
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } catch (e) {
      state.geo = { status: "error", message: "이 화면에서는 위치 기능을 쓸 수 없어요. 배포된 웹 주소에서 열어 주세요." }; render();
    }
  }

  /* =========================================================
     6. 오늘
     ========================================================= */
  function originOptions(ctx) {
    var cur = state.settings.loc;
    var autoName = ctx.auto === "bus" ? "통학버스 이용" : ctx.auto === "STOP" ? "목포대정류소" : bName(ctx.auto);
    var o = ['<option value="auto"' + (cur === "auto" ? " selected" : "") + ">자동: " + esc(autoName) + "</option>",
      '<option value="bus"' + (cur === "bus" ? " selected" : "") + ">통학버스 타고 등교</option>",
      '<option value="STOP"' + (cur === "STOP" ? " selected" : "") + ">목포대정류소에서 출발</option>"];
    BLD_ORDER.forEach(function (k) { o.push('<option value="' + k + '"' + (cur === k ? " selected" : "") + ">" + esc(bLabel(k)) + "에서 출발</option>"); });
    return '<div class="origin-row"><label for="originSel">출발지</label><select id="originSel">' + o.join("") + "</select></div>";
  }

  function busTripHtml(t, p) {
    var s = statusOf(t.slack), tr = t.trip;
    return '<div class="trip' + (t.mine ? " mine" : "") + '"><span class="dep">' + fmt(t.dep) + '</span><span class="info"><b>' + esc(tr.place) + "</b><br><span>도림 " + fmt(t.dep + tr.eta) + " → 강의실 " + fmt(t.arr) + "</span></span>" +
      '<span class="slack ' + s.cls + '">' + slackText(t.slack) + '</span><span class="tags">' + (t.mine ? '<span class="tag blue">내 승차 지점</span>' : "") + '<span class="tag">' + esc(daysLabel(tr)) + "</span>" + (tr.note ? '<span class="tag">' + esc(tr.note) + "</span>" : "") + '<span class="tag src">이동 ' + tr.eta + "분 + 도보 " + p.walk + "분 추정</span></span>" + (t.mine ? '<span class="tags">' + lineLinks(tr, true) + "</span>" : "") + "</div>";
  }

  function renderToday() {
    var v = el("view-today"), n = now(), ctx = context(n), h = [];
    if (!state.timetable.length) { v.innerHTML = '<div class="card glass empty">등록된 수업이 없어요.<br><br><a class="btn blue" href="#timetable">시간표에 수업 추가하기</a></div>'; return; }
    var c = ctx.next, start = toMin(c.start), p = plan(ctx, n);

    if (ctx.current) h.push('<div class="banner">지금 수업 중 · <b>' + esc(ctx.current.name) + "</b> " + esc(bName(ctx.current.bld)) + " " + esc(ctx.current.room) + '호, <span class="num">' + esc(ctx.current.end) + "</span> 종료</div>");

    var mainSlack = p.type === "walk" ? p.slack : p.mine ? p.mine.slack : p.best ? p.best.slack : (p.trips[0] ? p.trips[0].slack : -99);
    var st = statusOf(mainSlack);
    var when = ctx.offset === 0 ? '<span class="big">수업까지 ' + dur(start - n.min) + "</span>"
      : '<span class="big">' + (ctx.offset === 1 ? "내일" : DAYS[c.day] + "요일") + ' <b class="num">' + esc(c.start) + "</b> 시작</span>";
    h.push('<article class="hero" aria-label="다음 수업"><div class="eyebrow">' + (ctx.offset === 0 ? "다음 수업" : "다음 수업 · " + DAYS[c.day] + "요일") + " · " + esc(c.start) + "–" + esc(c.end) + "</div>" +
      '<p class="class-name">' + esc(c.name) + '</p><div class="place"><span class="bld">' + esc(bLabel(c.bld)) + '</span><span class="room">' + esc(c.room) + '</span><small>' + floorOf(c.room) + "층" + (c.memo ? " · " + esc(c.memo) : "") + "</small></div>" +
      '<div class="foot">' + when + '<span class="status ' + st.cls + '" role="status"><span class="ico" aria-hidden="true">' + st.ico + "</span>" + st.label + "</span></div></article>");

    h.push('<article class="card glass" aria-label="이동 방법">');
    if (p.type === "bus") {
      h.push('<div class="sec-head"><h3>' + (ctx.offset === 0 ? "탈 수 있는 " : "") + esc(state.settings.myArea) + " 등교 통학버스</h3><small>도착 시각은 추정</small></div>");
      if (p.noService) h.push('<p class="tip">주말·공휴일에는 통학버스가 운행하지 않아요.</p>');
      else if (!p.trips.length) h.push('<p class="tip">오늘 남은 등교 통학버스가 없어요. 210번 시내버스나 240-1번 농어촌버스를 이용하세요. 시각은 통학버스 탭에서 확인할 수 있어요.</p>');
      else p.trips.forEach(function (t) { h.push(busTripHtml(t, p)); });
      if (p.missedMine && !p.noService) {
        h.push('<p class="tip"><b>' + esc(state.settings.myBoard) + "에서 타는 버스는 제시간에 탈 수 있는 게 없어요.</b> " + (p.best ? fmt(p.best.dep) + " " + esc(p.best.trip.place) + " 출발 버스를 타면 " + slackText(p.best.slack) + "이에요." : "제시간에 도착하는 통학버스가 없어요. 210번 시내버스 등 다른 교통편을 알아보고, 늦는다면 미리 알려 주세요.") + "</p>");
      }
    } else {
      var fromName = ctx.origin === "STOP" ? "목포대정류소" : bName(ctx.origin);
      h.push('<div class="sec-head"><h3>' + esc(fromName) + "에서 걸어서</h3><small>" + (ctx.origin === c.bld ? "같은 건물" : "도보 시간은 추정") + "</small></div>");
      h.push('<div class="walk-grid"><div><small>도보</small><b>' + p.walk + '</b>분</div><div><small>층 이동</small><b>' + p.inside + '</b>분</div><div><small>지금 출발하면</small><b>' + fmt(p.arr) + "</b></div></div>");
      h.push('<p class="tip">' + (p.slack >= 0 ? "지금 출발하면 <b>" + slackText(p.slack) + "</b>. " : "<b>지금 출발해도 " + slackText(p.slack) + "</b>. ") + '늦어도 <b class="num">' + fmt(p.leaveBy) + "</b>에는 출발하세요.</p>");
    }
    h.push(originOptions(ctx));
    h.push('<div class="btn-row"><a class="btn blue" href="#route">강의실까지 길 안내</a></div>');
    h.push('<div class="meta"><span>' + esc(BUS_BASIS) + "</span></div></article>");

    // 하교 안내: 수업이 다 끝났거나, 오후(12시 이후)에 오늘 마지막 수업이 끝난 뒤 탈 버스
    var todayList = classesOn(n.day), lastEnd = todayList.length ? toMin(todayList[todayList.length - 1].end) : null;
    var showOut = isWeekday(n.day) && todayList.length && (ctx.todayDone || n.min >= 720);
    if (showOut) {
      var from = Math.max(n.min, lastEnd);
      var outs = tripsFor(state.settings.myArea, "out", n.day).filter(function (t) { return toMin(depOn(t, n.day)) >= from; });
      outs.sort(function (a, b) { return (isMine(b) ? 1 : 0) - (isMine(a) ? 1 : 0) || toMin(depOn(a, n.day)) - toMin(depOn(b, n.day)); });
      outs = outs.slice(0, 5).sort(function (a, b) { return toMin(depOn(a, n.day)) - toMin(depOn(b, n.day)); });
      h.push('<article class="card glass"><div class="sec-head"><h3>' + (ctx.todayDone ? "오늘 수업 끝 · 하교 통학버스" : "마지막 수업(" + fmt(lastEnd) + " 종료) 뒤 하교 통학버스") + "</h3><small>" + esc(state.settings.myArea) + " · 도림캠퍼스 출발</small></div>");
      if (outs.length) outs.forEach(function (t) { var d = toMin(depOn(t, n.day)); h.push('<div class="trip' + (isMine(t) ? " mine" : "") + '"><span class="dep">' + fmt(d) + '</span><span class="info"><b>' + esc(t.place) + "행</b><br><span>" + esc(t.stops.slice(1, 4).join(" → ")) + (t.stops.length > 4 ? " …" : "") + '</span></span><span class="slack">' + dur(d - n.min).replace(/<\/?b>/g, "") + ' 뒤</span><span class="tags">' + (isMine(t) ? '<span class="tag blue">내 하차 지점</span>' : "") + '<span class="tag">' + esc(daysLabel(t)) + "</span>" + (t.note ? '<span class="tag">' + esc(t.note) + "</span>" : "") + "</span></div>"); });
      else h.push('<p class="tip">오늘 남은 하교 통학버스가 없어요. 210번 시내버스를 이용하세요.</p>');
      h.push("</article>");
    }

    var rest = ctx.offset === 0 ? classesOn(n.day).filter(function (x) { return toMin(x.start) > start; }) : [];
    if (rest.length) {
      h.push('<article class="card glass"><div class="sec-head"><h3>오늘 이어지는 수업</h3><small>' + rest.length + "개</small></div>");
      rest.forEach(function (x) { h.push('<div class="rest-row"><span class="t">' + esc(x.start) + "<br>" + esc(x.end) + '</span><span><span class="n">' + esc(x.name) + '</span><br><span class="p">' + esc(bLabel(x.bld)) + " " + esc(x.room) + "호</span></span></div>"); });
      h.push("</article>");
    }
    v.innerHTML = h.join("");
    el("originSel").addEventListener("change", function (e) { state.settings.loc = e.target.value; state.arrived = null; saveSettings(); render(); });
  }

  /* =========================================================
     7. 길 안내
     ========================================================= */
  // 길 위 접속점과 건물 입구 쪽 끝점
  function attach(code) {
    if (code === "STOP") return { road: STOP.road, edge: STOP.road, side: "V" };
    var b = BUILDINGS[code], cx = b.box[0] + b.box[2] / 2, cy = b.box[1] + b.box[3] / 2;
    if (b.side === "V" || b.side === "V2") {
      var x = b.side === "V" ? ROAD_V : ROAD_V2, right = b.box[0] > x;
      return { road: [x, cy], edge: [right ? b.box[0] : b.box[0] + b.box[2], cy], side: b.side };
    }
    var below = b.box[1] > ROAD_H;
    return { road: [cx, ROAD_H], edge: [cx, below ? b.box[1] : b.box[1] + b.box[3]], side: "H" };
  }
  function junction(side) { return side === "V" ? J1 : side === "V2" ? J2 : null; }
  function pathPoints(from, to) {
    var a = attach(from), b = attach(to), pts = [a.edge, a.road];
    if (a.side !== b.side) {
      var ja = junction(a.side), jb = junction(b.side);
      if (ja) pts.push(ja);
      if (jb) pts.push(jb);
    }
    pts.push(b.road, b.edge);
    return pts;
  }

  function mapSvg(ctx) {
    var dest = ctx.next.bld, o = ctx.origin, d = BUILDINGS[dest];
    var from = (o === "bus" || o === "STOP") ? "STOP" : o;
    var s = ['<svg class="map" viewBox="0 0 340 260" role="img" aria-label="도림캠퍼스 개략도: ' + esc(from === "STOP" ? "목포대정류소" : bName(o)) + "에서 " + esc(d.name) + '까지">'];
    s.push('<rect class="ground" x="0" y="0" width="340" height="260" rx="18"/>');
    s.push('<path class="road" d="M' + ROAD_V + ' 254 L' + ROAD_V + ' 8 M' + ROAD_V + " " + ROAD_H + " L330 " + ROAD_H + " M" + ROAD_V2 + " " + ROAD_H + " L" + ROAD_V2 + ' 14"/>');
    s.push('<circle class="fountain" cx="172" cy="152" r="9"/><text class="lbl" x="184" y="155">분수대</text>');
    BLD_ORDER.forEach(function (k) {
      var b = BUILDINGS[k], cls = "bldg" + (k === dest ? " dest" : "") + (k === o && k !== dest ? " origin" : ""), cx = b.box[0] + b.box[2] / 2, cy = b.box[1] + b.box[3] / 2;
      var label = b.name.replace("자연과학대학 ", "자연대 ");
      s.push('<g class="' + cls + '"><rect x="' + b.box[0] + '" y="' + b.box[1] + '" width="' + b.box[2] + '" height="' + b.box[3] + '" rx="8"/><text x="' + cx + '" y="' + (cy + (b.code ? -1 : 4)) + '">' + label + "</text>" + (b.code ? '<text class="code" x="' + cx + '" y="' + (cy + 11) + '">' + b.code + "</text>" : "") + "</g>");
    });
    if (from !== dest) {
      var pts = pathPoints(from, dest);
      s.push('<polyline class="route" points="' + pts.map(function (q) { return q.join(","); }).join(" ") + '"/>');
      if (from !== "STOP") s.push('<circle class="start" cx="' + pts[0][0] + '" cy="' + pts[0][1] + '" r="5"/>');
      s.push('<circle class="pin" cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="6"/>');
    }
    s.push('<g><rect x="' + (STOP.xy[0] - 20) + '" y="' + (STOP.xy[1] - 10) + '" width="40" height="20" rx="10" class="pin"/><text class="lbl" x="' + STOP.xy[0] + '" y="' + (STOP.xy[1] + 4) + '" text-anchor="middle" style="fill:#fff">BUS</text></g>');
    s.push('<text class="lbl" x="' + (ROAD_V + 8) + '" y="250">↓ 정문·종합운동장 방향</text>');
    s.push("</svg>");
    return s.join("");
  }

  function routeSteps(ctx, p) {
    var c = ctx.next, d = BUILDINGS[c.bld], steps = [], fl = floorOf(c.room);
    if (ctx.origin === "bus") {
      var t = p.mine || p.best || p.trips[0];
      if (t) steps.push({ t: fmt(t.dep) + " 통학버스 타기", s: t.trip.place + "에서 승차 · 도림캠퍼스까지 약 " + t.trip.eta + "분(추정)" });
      steps.push({ t: "도림캠퍼스 목포대정류소에서 내리기", s: "인문대학(B15) 서쪽 큰길가 정류소" });
      steps.push({ t: d.name + (d.code ? "(" + d.code + ")" : "") + "로 걷기", s: "도보 약 " + p.walk + "분(추정)" });
    } else if (ctx.origin === "STOP") {
      steps.push({ t: d.name + "로 걷기", s: "정류소에서 도보 약 " + p.walk + "분(추정)" });
    } else if (ctx.origin !== c.bld) {
      steps.push({ t: bName(ctx.origin) + " 나서기", s: "개략도의 파란 점선을 따라 이동" });
      steps.push({ t: d.name + (d.code ? "(" + d.code + ")" : "") + "로 걷기", s: "도보 약 " + p.walk + "분(추정)" });
    } else {
      steps.push({ t: "같은 건물 안에서 이동", s: d.name + " 안에서 바로 이동해요" });
    }
    steps.push({ t: fl <= 1 ? "1층 복도로 들어가기" : fl + "층으로 올라가기", s: fl <= 1 ? "건물에 들어가 1층에서 찾기" : "엘리베이터나 계단 이용" });
    steps.push({ t: c.room + "호 찾기", s: c.memo ? c.memo : "강의실 찾는 팁은 시간표에서 '찾아가는 팁'으로 적어 둘 수 있어요" });
    return steps;
  }

  function renderRoute() {
    var v = el("view-route"), n = now(), ctx = context(n), h = [];
    if (!state.timetable.length) { v.innerHTML = '<div class="card glass empty">시간표에 수업을 추가하면 길 안내가 나타나요.</div>'; return; }
    var c = ctx.next, p = plan(ctx, n), steps = routeSteps(ctx, p), key = c.id + "|" + ctx.origin, done = state.stepsDone[key] || [];
    h.push('<h2 class="view-title">' + esc(c.name) + " · " + esc(bName(c.bld)) + " " + esc(c.room) + "호</h2>");
    h.push('<article class="card glass"><div class="sec-head"><h3>도림캠퍼스 개략도</h3><small>실제 축척 아님</small></div>' + mapSvg(ctx) + '<p class="note">학교 통학버스 시스템 지도에서 본 건물 배치를 단순하게 옮긴 개략도예요. 거리와 도보 시간은 추정이에요.</p></article>');
    h.push('<article class="card glass"><div class="sec-head"><h3>단계별 안내</h3><small>' + done.length + " / " + steps.length + ' 완료</small></div><ol class="steps">');
    steps.forEach(function (s, i) {
      var on = done.indexOf(i) >= 0;
      h.push('<li class="' + (on ? "done" : "") + '"><button type="button" class="check" data-step="' + i + '" aria-pressed="' + on + '" aria-label="' + (i + 1) + "단계 " + (on ? "완료 취소" : "완료로 표시") + '">' + (on ? "✓" : i + 1) + '</button><div><div class="s-t">' + esc(s.t) + '</div><div class="s-s">' + esc(s.s) + "</div></div></li>");
    });
    h.push("</ol></article>");
    if (state.arrived && state.arrived.key === key) {
      var a = state.arrived, ok = a.slack >= 0;
      h.push('<div class="arrived ' + (ok ? "ok" : "bad") + '" role="status"><b>' + (ok ? "✓ " : "") + fmt(a.at) + " 도착 · " + (ok ? "수업 " + a.slack + "분 전" : "수업 시작 " + (-a.slack) + "분 후") + "</b><p>" + (ok ? "제시간에 도착했어요." : "다음에는 더 이른 통학버스나 출발 시각을 추천할게요.") + (a.demo ? " (데모 시각에서는 예상 도착 시각으로 기록해요)" : "") + "</p></div>");
      h.push('<button type="button" class="btn ghost" id="resetArrive">안내 다시 시작</button>');
    } else h.push('<button type="button" class="btn blue" id="arriveBtn">도착했어요</button>');
    v.innerHTML = h.join("");

    v.querySelectorAll(".check").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = parseInt(b.getAttribute("data-step"), 10), list = (state.stepsDone[key] || []).slice(), at = list.indexOf(i);
        if (at >= 0) list.splice(at, 1); else list.push(i);
        state.stepsDone[key] = list; renderRoute();
        var again = v.querySelector('.check[data-step="' + i + '"]'); if (again) again.focus();
      });
    });
    if (el("arriveBtn")) el("arriveBtn").addEventListener("click", function () {
      var demo = state.settings.mode === "demo", at;
      if (demo) { var t = p.type === "walk" ? null : (p.mine || p.best || p.trips[0]); at = p.type === "walk" ? p.arr : (t ? t.arr : n.min); } else at = n.min;
      state.stepsDone[key] = steps.map(function (_, i) { return i; });
      state.arrived = { key: key, at: at, slack: toMin(c.start) - at, demo: demo }; renderRoute();
    });
    if (el("resetArrive")) el("resetArrive").addEventListener("click", function () { state.arrived = null; state.stepsDone[key] = []; renderRoute(); });
  }

  /* =========================================================
     8. 시간표
     ========================================================= */
  var undoFn = null, toastTimer = null;
  function toast(text, undo) {
    el("toastText").textContent = text; el("toast").hidden = false;
    el("toastUndo").style.display = undo ? "" : "none"; undoFn = undo || null;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el("toast").hidden = true; undoFn = null; }, 5000);
  }
  function saveTT() { save("mnu_timetable", state.timetable); }

  function classForm(c) {
    c = c || { name: "", day: 1, start: "09:00", end: "10:15", bld: "ENG", room: "", memo: "" };
    var days = [1, 2, 3, 4, 5].map(function (d) { return '<option value="' + d + '"' + (c.day === d ? " selected" : "") + ">" + DAYS[d] + "요일</option>"; }).join("");
    var blds = BLD_ORDER.map(function (k) { return '<option value="' + k + '"' + (c.bld === k ? " selected" : "") + ">" + esc(bLabel(k)) + "</option>"; }).join("");
    return '<form class="card glass" id="classForm" novalidate><div class="sec-head"><h3>' + (state.editingId === "new" ? "수업 추가" : "수업 수정") + '</h3></div><div class="form-grid">' +
      '<div class="field full"><label for="f-name">과목명</label><input id="f-name" maxlength="30" value="' + esc(c.name) + '" placeholder="예: 웹프로그래밍"></div>' +
      '<div class="field"><label for="f-day">요일</label><select id="f-day">' + days + '</select></div>' +
      '<div class="field"><label for="f-bld">건물</label><select id="f-bld">' + blds + '</select></div>' +
      '<div class="field"><label for="f-start">시작</label><input type="time" id="f-start" value="' + esc(c.start) + '"></div>' +
      '<div class="field"><label for="f-end">종료</label><input type="time" id="f-end" value="' + esc(c.end) + '"></div>' +
      '<div class="field full"><label for="f-room">호실 (숫자 3자리, 첫 자리가 층)</label><input id="f-room" inputmode="numeric" maxlength="3" value="' + esc(c.room) + '" placeholder="예: 302"></div>' +
      '<div class="field full"><label for="f-memo">찾아가는 팁 (선택)</label><input id="f-memo" maxlength="40" value="' + esc(c.memo || "") + '" placeholder="예: 3층 엘리베이터 내려서 오른쪽 끝"></div>' +
      '</div><p class="error" id="formError" role="alert"></p><div class="btn-row"><button type="submit" class="btn blue">' + (state.editingId === "new" ? "추가" : "저장") + '</button><button type="button" class="btn ghost" id="cancelForm">취소</button></div></form>';
  }

  function renderTimetable() {
    var v = el("view-timetable"), n = now(), h = ['<h2 class="view-title">내 시간표</h2>'];
    if (state.editingId !== null) h.push(classForm(state.editingId === "new" ? null : state.timetable.filter(function (c) { return c.id === state.editingId; })[0]));
    else h.push('<button type="button" class="btn blue" id="addClass">+ 수업 추가</button>');
    if (!state.timetable.length) h.push('<div class="card glass empty">등록된 수업이 없어요.</div>');
    [1, 2, 3, 4, 5].forEach(function (d) {
      var list = classesOn(d); if (!list.length) return;
      h.push('<div class="day"><h3>' + DAYS[d] + "요일" + (d === n.day ? " · 오늘" : "") + "</h3>");
      list.forEach(function (c) {
        h.push('<div class="class-row' + (d === n.day ? " today" : "") + '"><span class="t">' + esc(c.start) + "<br>" + esc(c.end) + '</span><span><span class="n">' + esc(c.name) + '</span><br><span class="p">' + esc(bLabel(c.bld)) + " " + esc(c.room) + "호" + (c.memo ? " · " + esc(c.memo) : "") + '</span></span><span class="row-actions"><button type="button" class="mini" data-edit="' + esc(c.id) + '" aria-label="' + esc(c.name) + ' 수정">수정</button><button type="button" class="mini del" data-del="' + esc(c.id) + '" aria-label="' + esc(c.name) + ' 삭제">삭제</button></span></div>');
      });
      h.push("</div>");
    });
    h.push('<button type="button" class="btn danger" id="resetTT">예시 시간표로 되돌리기</button>');
    v.innerHTML = h.join("");

    if (el("addClass")) el("addClass").addEventListener("click", function () { state.editingId = "new"; renderTimetable(); el("f-name").focus(); });
    v.querySelectorAll("[data-edit]").forEach(function (b) { b.addEventListener("click", function () { state.editingId = b.getAttribute("data-edit"); renderTimetable(); el("f-name").focus(); }); });
    v.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-del"), idx = -1;
        state.timetable.forEach(function (c, i) { if (c.id === id) idx = i; });
        if (idx < 0) return;
        var removed = state.timetable.splice(idx, 1)[0]; saveTT(); render();
        toast("‘" + removed.name + "’ 수업을 삭제했어요.", function () { state.timetable.splice(idx, 0, removed); saveTT(); render(); });
      });
    });
    el("resetTT").addEventListener("click", function () {
      var before = state.timetable.slice(); state.timetable = withIds(SAMPLE_TIMETABLE); state.editingId = null; saveTT(); render();
      toast("예시 시간표로 되돌렸어요.", function () { state.timetable = before; saveTT(); render(); });
    });
    var form = el("classForm");
    if (form) {
      el("cancelForm").addEventListener("click", function () { state.editingId = null; renderTimetable(); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var it = { name: el("f-name").value.trim(), day: parseInt(el("f-day").value, 10), start: el("f-start").value, end: el("f-end").value, bld: el("f-bld").value, room: el("f-room").value.trim(), memo: el("f-memo").value.trim() };
        var err = "";
        if (!it.name) err = "과목명을 입력하세요.";
        else if (!it.start || !it.end) err = "시작과 종료 시각을 모두 입력하세요.";
        else if (toMin(it.end) <= toMin(it.start)) err = "종료 시각은 시작 시각보다 늦어야 해요.";
        else if (!/^[1-9][0-9]{2}$/.test(it.room)) err = "호실은 302처럼 숫자 3자리로 입력하세요. 첫 자리가 층이에요.";
        else {
          var clash = state.timetable.filter(function (c) { return c.id !== state.editingId && c.day === it.day && toMin(c.start) < toMin(it.end) && toMin(it.start) < toMin(c.end); })[0];
          if (clash) err = DAYS[it.day] + "요일 " + clash.start + "–" + clash.end + " ‘" + clash.name + "’ 수업과 시간이 겹쳐요.";
        }
        if (err) { el("formError").textContent = err; return; }
        if (state.editingId === "new") { it.id = "c" + Date.now().toString(36); state.timetable.push(it); toast("‘" + it.name + "’ 수업을 추가했어요."); }
        else { state.timetable = state.timetable.map(function (c) { return c.id === state.editingId ? Object.assign({ id: c.id }, it) : c; }); toast("‘" + it.name + "’ 수업을 수정했어요."); }
        state.editingId = null; saveTT(); render();
      });
    }
  }

  /* =========================================================
     9. 통학버스
     ========================================================= */
  function tripRow(t, n) {
    var mine = isMine(t), editing = state.editingTrip === t.id;
    var past = isWeekday(n.day) && runsOn(t, n.day) && toMin(depOn(t, n.day)) < n.min;
    var h = '<div class="route-card' + (mine ? " mine" : "") + '"><div class="top"><b>' + esc(t.place) + (t.dir === "out" ? "행" : "") + '</b><span class="time"' + (past ? ' style="opacity:.45"' : "") + ">" + esc(t.dep) + "</span></div>" +
      '<div class="row">' + (mine ? '<span class="tag blue">' + (t.dir === "in" ? "내 승차 지점" : "내 하차 지점") + "</span>" : "") + '<span class="tag">' + esc(daysLabel(t)) + "</span>" + (t.n > 1 ? '<span class="tag">' + t.n + "대</span>" : "") + (t.note ? '<span class="tag">' + esc(t.note) + "</span>" : "") + (t.dir === "in" ? '<span class="tag src">도림까지 약 ' + t.eta + "분(추정)</span>" : "") + (t.edited ? '<span class="tag src">직접 수정</span>' : "") + "</div>" +
      '<details class="stops"><summary>경유 정류장 ' + t.stops.length + "곳</summary>" + esc(t.stops.join(" → ")) + "</details>";
    if (editing) {
      h += '<div class="field-row"><div class="field"><label for="tr-dep">출발 시각</label><input type="time" id="tr-dep" value="' + esc(t.dep) + '"></div>' +
        (t.dir === "in" ? '<div class="field"><label for="tr-eta">도림까지(분)</label><input type="number" min="5" max="180" id="tr-eta" value="' + t.eta + '"></div>' : "") +
        '</div><div class="btn-row"><button type="button" class="btn blue sm" data-tsave="' + t.id + '">저장</button><button type="button" class="btn ghost sm" data-tcancel="1">취소</button></div>';
    } else {
      h += '<div class="row">' + (!mine ? '<button type="button" class="mini" data-tmine="' + t.id + '">' + (t.dir === "in" ? "여기서 타요" : "여기서 내려요") + "</button>" : "") + '<button type="button" class="mini" data-tedit="' + t.id + '">시각 고치기</button>' + lineLinks(t, true) + "</div>";
    }
    return h + "</div>";
  }

  function renderBus() {
    var v = el("view-bus"), n = now(), area = state.busArea || state.settings.myArea, h = ['<h2 class="view-title">통학버스</h2>'];
    h.push('<div class="seg" role="group" aria-label="지역 선택" style="grid-template-columns:repeat(3,1fr)">' + AREAS.map(function (a) { return '<button type="button" data-area="' + a + '" aria-pressed="' + (a === area) + '">' + a + "</button>"; }).join("") + "</div>");
    h.push('<div class="banner"><b>' + esc(BUS_BASIS) + "</b> · 국립목포대 학생지원과. " + esc(BUS_NOTICE) + "</div>");
    if (area === state.settings.myArea) h.push('<p class="note">내 승차 지점: <b>' + esc(state.settings.myBoard) + "</b> · 내 하차 지점: <b>" + esc(state.settings.myDest) + "</b></p>");
    else h.push('<p class="note">지금 내 지역은 ' + esc(state.settings.myArea) + "이에요. 아래에서 '여기서 타요'를 누르면 " + esc(area) + "으로 바뀌어요.</p>");
    h.push('<article class="card glass"><div class="sec-head"><h3>등교 · 도림캠퍼스행</h3><small>' + tripsFor(area, "in").length + "개 출발</small></div>");
    tripsFor(area, "in").forEach(function (t) { h.push(tripRow(t, n)); });
    h.push('</article><article class="card glass"><div class="sec-head"><h3>하교 · 도림캠퍼스 출발</h3><small>' + tripsFor(area, "out").length + "개 출발</small></div>");
    tripsFor(area, "out").forEach(function (t) { h.push(tripRow(t, n)); });
    h.push("</article>");
    h.push('<article class="card glass"><div class="sec-head"><h3>실시간 차량 위치</h3><small>학교 통학버스 시스템</small></div><p class="tip">버스마다 있는 <b>학교 시스템에서 위치 보기</b>를 누르면 학교 통학버스 시스템의 그 노선 위치 화면을 열어요. 처음 열 때 로그인 화면이 나오면 로그인하지 않아도 돼요. 아래쪽 <b>‘차량위치 조회’</b>를 누르고 안내된 노선 이름을 고르면 지도에서 차량 위치를 볼 수 있어요. 운행 중이 아닌 노선은 목록에 나오지 않아요.</p><div class="btn-row"><a class="btn blue" href="' + UNIBUS_LOCATION + '" target="_blank" rel="noopener">운행 중인 차량 보기 ↗</a><a class="btn ghost" href="' + UNIBUS + '#!/line" target="_blank" rel="noopener">전체 노선 및 정거장 ↗</a></div></article>');
    h.push('<article class="card glass"><div class="sec-head"><h3>다른 교통편</h3><small>시각은 각 운영 기관 확인</small></div>');
    OTHER_TRANSIT.forEach(function (o) { h.push('<div class="rest-row" style="grid-template-columns:1fr"><span><span class="n">' + esc(o.name) + '</span><br><span class="p">' + esc(o.note) + "</span></span></div>"); });
    h.push("</article>");
    h.push('<article class="card glass"><div class="sec-head"><h3>데이터 출처</h3></div><ul class="src-list">' +
      "<li>통학버스 노선·출발 시각·운행 요일: 국립목포대 학생지원과 「2026학년도 2학기 통학버스 노선표(안)」 (광주권·목포권·해남권 전체)</li>" +
      "<li>노선 번호·차량 위치·캠퍼스 배치: 국립목포대 통학버스 시스템(mokpo.unibus.kr)의 노선 및 정거장, 차량위치조회 지도</li>" +
      "<li>건물 코드: 국립목포대 캠퍼스맵 (A09 중앙도서관, A14 학생회관, A60 플라자60, B15 인문대학, B17 교수회관, C30·C31 자연과학대학 등)</li>" +
      "<li>캠퍼스 주소: 전남 무안군 청계면 영산로 1666</li>" +
      "<li>추정값: 버스 출발부터 도림캠퍼스 도착까지 시간, 건물 간 도보 시간, 개략도의 거리, 캠퍼스 중심 좌표</li></ul>" +
      '<button type="button" class="btn danger sm" id="resetTrips">통학버스 데이터 초기화</button></article>');
    v.innerHTML = h.join("");

    v.querySelectorAll("[data-area]").forEach(function (b) { b.addEventListener("click", function () { state.busArea = b.getAttribute("data-area"); state.editingTrip = null; renderBus(); }); });
    v.querySelectorAll("[data-tmine]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = tripById(b.getAttribute("data-tmine"));
        state.settings.myArea = t.area;
        if (t.dir === "in") state.settings.myBoard = t.place; else state.settings.myDest = t.place;
        saveSettings(); toast(t.dir === "in" ? "승차 지점을 ‘" + t.place + "’로 정했어요." : "하차 지점을 ‘" + t.place + "’로 정했어요."); render();
      });
    });
    v.querySelectorAll("[data-tedit]").forEach(function (b) { b.addEventListener("click", function () { state.editingTrip = b.getAttribute("data-tedit"); renderBus(); el("tr-dep").focus(); }); });
    v.querySelectorAll("[data-tcancel]").forEach(function (b) { b.addEventListener("click", function () { state.editingTrip = null; renderBus(); }); });
    v.querySelectorAll("[data-tsave]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = tripById(b.getAttribute("data-tsave")), dep = el("tr-dep").value, etaEl = el("tr-eta");
        if (!dep) return;
        var before = JSON.parse(JSON.stringify(state.trips));
        t.dep = dep; t.fri = null; if (etaEl) { var ev = parseInt(etaEl.value, 10); if (ev >= 5 && ev <= 180) t.eta = ev; }
        t.edited = true; state.editingTrip = null; saveTrips(); render();
        toast(t.place + " " + dep + " 버스를 저장했어요.", function () { state.trips = before; saveTrips(); render(); });
      });
    });
    el("resetTrips").addEventListener("click", function () {
      var before = state.trips; state.trips = JSON.parse(JSON.stringify(TRIPS_DEFAULT)); saveTrips(); render();
      toast("통학버스 데이터를 노선표 값으로 되돌렸어요.", function () { state.trips = before; saveTrips(); render(); });
    });
  }

  /* =========================================================
     10. 라우팅·이벤트
     ========================================================= */
  var TABS = ["today", "route", "timetable", "bus"];
  function readHash() { var t = (location.hash || "").replace("#", ""); return TABS.indexOf(t) >= 0 ? t : "today"; }
  function render() {
    renderTop();
    TABS.forEach(function (t) { el("view-" + t).hidden = t !== state.tab; });
    document.querySelectorAll(".tabbar a").forEach(function (a) { if (a.getAttribute("data-tab") === state.tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    if (state.tab === "today") renderToday(); else if (state.tab === "route") renderRoute(); else if (state.tab === "timetable") renderTimetable(); else renderBus();
  }
  window.addEventListener("hashchange", function () { state.tab = readHash(); render(); window.scrollTo(0, 0); });

  function setDemo(day, min) {
    state.settings.mode = "demo"; state.settings.day = day; state.settings.min = ((min % 1440) + 1440) % 1440;
    state.arrived = null; state.stepsDone = {}; saveSettings(); render();
  }
  function togglePanel(id, btn) {
    var p = el(id), open = p.hidden; p.hidden = !open; el(btn).setAttribute("aria-expanded", String(open));
  }
  el("demoDay").innerHTML = [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<option value="' + d + '">' + DAYS[d] + "요일</option>"; }).join("");
  el("presets").innerHTML = PRESETS.map(function (p, i) { return '<button type="button" class="chip" data-preset="' + i + '">' + p.label + "</button>"; }).join("");
  el("clockBtn").addEventListener("click", function () { togglePanel("timePanel", "clockBtn"); });
  el("locBtn").addEventListener("click", function () { togglePanel("locPanel", "locBtn"); });
  el("modeDemo").addEventListener("click", function () { state.settings.mode = "demo"; saveSettings(); render(); });
  el("modeReal").addEventListener("click", function () { state.settings.mode = "real"; state.arrived = null; saveSettings(); render(); });
  el("demoDay").addEventListener("change", function (e) { setDemo(parseInt(e.target.value, 10), state.settings.min); });
  el("demoTime").addEventListener("change", function (e) { if (e.target.value) setDemo(state.settings.day, toMin(e.target.value)); });
  el("minus5").addEventListener("click", function () { setDemo(state.settings.day, state.settings.min - 5); });
  el("plus5").addEventListener("click", function () { setDemo(state.settings.day, state.settings.min + 5); });
  el("presets").addEventListener("click", function (e) {
    var b = e.target.closest("[data-preset]"); if (!b) return;
    var p = PRESETS[parseInt(b.getAttribute("data-preset"), 10)];
    state.settings.loc = "auto"; setDemo(p.day, p.min);
    el("timePanel").hidden = true; el("clockBtn").setAttribute("aria-expanded", "false");
    if (state.tab !== "today") location.hash = "today";
  });
  el("locGet").addEventListener("click", requestGeo);
  el("bigBtn").addEventListener("click", function () { state.settings.big = !state.settings.big; saveSettings(); render(); });
  el("locClear").addEventListener("click", function () { state.settings.useGeo = false; state.geo = { status: "idle" }; saveSettings(); render(); });
  el("locSave").addEventListener("click", function () {
    if (state.geo.lat == null) return;
    state.campus.lat = state.geo.lat; state.campus.lng = state.geo.lng; save("mnu_campus", { lat: state.campus.lat, lng: state.campus.lng });
    state.geo.dist = 0; state.geo.status = "on"; toast("지금 위치를 캠퍼스 기준점으로 저장했어요."); render();
  });
  el("toastUndo").addEventListener("click", function () { if (undoFn) { var f = undoFn; undoFn = null; f(); } el("toast").hidden = true; });

  setInterval(function () { if (state.settings.mode === "real") render(); }, 30000);

  // 홈 화면에 추가(PWA): GitHub Pages 같은 일반 웹 주소에서만 등록. 미리보기 화면에서는 조용히 건너뜀
  try {
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(function () { /* 등록할 수 없는 환경 */ });
    }
  } catch (e) { /* 등록할 수 없는 환경 */ }
  state.tab = readHash();
  if (state.settings.useGeo) requestGeo();
  render();

  window.__yk = { context: context, plan: plan, now: now, state: state, fmt: fmt, haversine: haversine };
})();
