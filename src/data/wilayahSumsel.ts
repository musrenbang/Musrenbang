export interface WilayahKabKota {
  id: string;
  name: string;
  kecamatan: {
    id: string;
    name: string;
    kelurahan: string[];
  }[];
}

export const WILAYAH_SUMSEL: WilayahKabKota[] = [
  {
    id: '1671',
    name: 'Kota Palembang',
    kecamatan: [
      { id: '167101', name: 'Ilir Barat I', kelurahan: ['Bukit Lama', 'Bukit Baru', 'Demang Lebar Daun', 'Lorok Pakjo', 'Siring Agung', 'Padang Selasa'] },
      { id: '167102', name: 'Ilir Barat II', kelurahan: ['30 Ilir', '29 Ilir', '28 Ilir', '27 Ilir', 'Kemang Manis'] },
      { id: '167103', name: 'Ilir Timur I', kelurahan: ['16 Ilir', '17 Ilir', '18 Ilir', '19 Ilir', '20 Ilir D-I', '20 Ilir D-II', '20 Ilir D-III', '20 Ilir D-IV', 'Kepandean'] },
      { id: '167104', name: 'Ilir Timur II', kelurahan: ['1 Koto', '2 Koto', '3 Ilir', '5 Ilir', 'Sungai Buah', 'Lawang Kidul'] },
      { id: '167105', name: 'Ilir Timur III', kelurahan: ['8 Ilir', '9 Ilir', '10 Ilir', '11 Ilir', 'Kuto Batu', 'Duku'] },
      { id: '167106', name: 'Seberang Ulu I', kelurahan: ['1 Ulu', '2 Ulu', '3-4 Ulu', '5 Ulu', '7 Ulu', 'Tuan Kentang'] },
      { id: '167107', name: 'Seberang Ulu II', kelurahan: ['11 Ulu', '12 Ulu', '13 Ulu', '14 Ulu', '16 Ulu', 'Tangga Takat'] },
      { id: '167108', name: 'Sukarami', kelurahan: ['Sukarami', 'Kebun Bunga', 'Talang Betutu', 'Talang Jambe', 'Sukodadi'] },
      { id: '167109', name: 'Sako', kelurahan: ['Sako', 'Sako Baru', 'Sukamaju', 'Sialang'] },
      { id: '167110', name: 'Kemuning', kelurahan: ['Ario Kemuning', 'Pipa Reja', 'Sekip Jaya', 'Talang Aman', '20 Ilir II', 'Pahlawan'] },
      { id: '167111', name: 'Kalidoni', kelurahan: ['Kalidoni', 'Bukit Sangkal', 'Sei Selincah', 'Sei Lais', 'Sungai Selayur'] },
      { id: '167112', name: 'Bukit Kecil', kelurahan: ['19 Ilir', '22 Ilir', '23 Ilir', '24 Ilir', '26 Ilir', 'Talang Semut'] },
      { id: '167113', name: 'Gandus', kelurahan: ['Gandus', 'Karang Anyar', 'Karang Jaya', 'Pulokerto', '36 Ilir'] },
      { id: '167114', name: 'Kertapati', kelurahan: ['Kertapati', 'Kemas Rindo', 'Ogan Baru', 'Karya Jaya', 'Keramasan'] },
      { id: '167115', name: 'Plaju', kelurahan: ['Plaju Darat', 'Plaju Ilir', 'Plaju Ulu', 'Bagus Kuning', 'Talang Bubuk', 'Talang Putri'] },
      { id: '167116', name: 'Alang-Alang Lebar', kelurahan: ['Alang-Alang Lebar', 'Karya Baru', 'Talang Kelapa', 'Srijaya'] },
      { id: '167117', name: 'Sematang Borang', kelurahan: ['Karya Mulya', 'Lebong Gajah', 'Sri Mulya', 'Sukamulya'] },
      { id: '167118', name: 'Jakabaring', kelurahan: ['8 Ulu', '9-10 Ulu', '15 Ulu', 'Silaberanti', 'Tuan Kentang'] }
    ]
  },
  {
    id: '1672',
    name: 'Kota Prabumulih',
    kecamatan: [
      { id: '167201', name: 'Prabumulih Barat', kelurahan: ['Prabumulih', 'Patih Galung', 'Payuputat', 'Gunung Kemala'] },
      { id: '167202', name: 'Prabumulih Timur', kelurahan: ['Prabujaya', 'Gunung Ibul', 'Muara Dua', 'Tanjung Raman', 'Karang Raja'] },
      { id: '167203', name: 'Prabumulih Selatan', kelurahan: ['Tanjung Menang', 'Majasari', 'Sukamerindu', 'Sukaraja'] },
      { id: '167204', name: 'Prabumulih Utara', kelurahan: ['Pasar I', 'Pasar II', 'Wonorejo', 'Anak Petai'] },
      { id: '167205', name: 'Cambai', kelurahan: ['Cambai', 'Sindur', 'Pangkul', 'Sungai Medang'] },
      { id: '167206', name: 'Rambang Kapak Tengah', kelurahan: ['Tanjung Rambang', 'Rambang Senuling', 'Karya Mulya', 'Talang Batu'] }
    ]
  },
  {
    id: '1673',
    name: 'Kota Pagar Alam',
    kecamatan: [
      { id: '167301', name: 'Pagar Alam Utara', kelurahan: ['Beringin Jaya', 'Curup Jare', 'Kuripan Babas', 'Pagar Alam'] },
      { id: '167302', name: 'Pagar Alam Selatan', kelurahan: ['Besemah Serasan', 'Hulu Rurah', 'Nendagung', 'Sidorejo', 'Tanjung Payang'] },
      { id: '167303', name: 'Dempo Utara', kelurahan: ['Bumi Agung', 'Agung Lawangan', 'Jangkar Mas', 'Rebah Tinggi'] },
      { id: '167304', name: 'Dempo Selatan', kelurahan: ['Lubuk Buntak', 'Atung Bungsu', 'Penjalang', 'Kance Diwe'] },
      { id: '167305', name: 'Dempo Tengah', kelurahan: ['Candi Jaya', 'Padang Temu', 'Rimba Candi', 'Karang Dalo'] }
    ]
  },
  {
    id: '1674',
    name: 'Kota Lubuk Linggau',
    kecamatan: [
      { id: '167401', name: 'Lubuk Linggau Barat I', kelurahan: ['Bandung Kiri', 'Bandung Ujung', 'Kayu Ara', 'Lubuk Aman', 'Pelita Jaya'] },
      { id: '167402', name: 'Lubuk Linggau Barat II', kelurahan: ['Keputraan', 'Pasar Permiri', 'Sidorejo', 'Ulak Lebar'] },
      { id: '167403', name: 'Lubuk Linggau Timur I', kelurahan: ['Air Kuti', 'Batu Urip', 'Taba Jemekeh', 'Watervang'] },
      { id: '167404', name: 'Lubuk Linggau Timur II', kelurahan: ['Cereme Taba', 'Dempo', 'Karya Bakti', 'Mesat Jaya'] },
      { id: '167405', name: 'Lubuk Linggau Utara I', kelurahan: ['Belalau I', 'Belalau II', 'Petanang Ilir', 'Petanang Ulu', 'Taba Baru'] },
      { id: '167406', name: 'Lubuk Linggau Utara II', kelurahan: ['Batu Urip Taba', 'Kenanga', 'Megang', 'Pasar Satelit', 'Puncak Kemuning'] },
      { id: '167407', name: 'Lubuk Linggau Selatan I', kelurahan: ['Air Kati', 'Jukung', 'Lubuk Binjai', 'Perumnas Rahma', 'Rahma'] },
      { id: '167408', name: 'Lubuk Linggau Selatan II', kelurahan: ['Karang Ketuan', 'Marga Mulya', 'Siring Agung', 'Tanah Periuk'] }
    ]
  },
  {
    id: '1607',
    name: 'Kabupaten Banyuasin',
    kecamatan: [
      { id: '160701', name: 'Talang Kelapa', kelurahan: ['Sukomoro', 'Talang Keramat', 'Air Batu', 'Kenten', 'Sungai Rengit', 'Tanah Mas'] },
      { id: '160702', name: 'Banyuasin I', kelurahan: ['Mariana', 'Mariana Ilir', 'Pematang Palas', 'Cinta Manis Baru'] },
      { id: '160703', name: 'Banyuasin II', kelurahan: ['Sungsang I', 'Sungsang II', 'Sungsang III', 'Sungsang IV', 'Teluk Payo'] },
      { id: '160704', name: 'Banyuasin III', kelurahan: ['Pangkalan Balai', 'Kedondong Raye', 'Mulya Agung', 'Kayuara Kuning'] },
      { id: '160705', name: 'Betung', kelurahan: ['Betung', 'Rimba Asam', 'Bukit', 'Lubuk Karet'] },
      { id: '160706', name: 'Sembawa', kelurahan: ['Liman Mulya', 'Mainan', 'Purwosari', 'Rejodadi', 'Sembawa'] },
      { id: '160707', name: 'Rambutan', kelurahan: ['Gelebak Dalam', 'Kebun Sahang', 'Rambutan', 'Suka Pindah'] }
    ]
  },
  {
    id: '1610',
    name: 'Kabupaten Ogan Ilir',
    kecamatan: [
      { id: '161001', name: 'Indralaya', kelurahan: ['Indralaya Indah', 'Indralaya Mulya', 'Indralaya Raya', 'Tanjung Sejaro', 'Sakaraja'] },
      { id: '161002', name: 'Indralaya Utara', kelurahan: ['Timbangan', 'Lorok', 'Palem Raya', 'Sungai Rambutan'] },
      { id: '161003', name: 'Indralaya Selatan', kelurahan: ['Meranjat I', 'Meranjat II', 'Meranjat III', 'Tebing Gerinting'] },
      { id: '161004', name: 'Tanjung Raja', kelurahan: ['Tanjung Raja', 'Tanjung Raja Barat', 'Tanjung Raja Timur', 'Belanti'] },
      { id: '161005', name: 'Pemulutan', kelurahan: ['Pemulutan Ilir', 'Pemulutan Ulu', 'Ibul Besar I', 'Ibul Besar II'] },
      { id: '161006', name: 'Tanjung Batu', kelurahan: ['Tanjung Batu', 'Tanjung Batu Seberang', 'Limbangan', 'Bangkerep'] }
    ]
  },
  {
    id: '1602',
    name: 'Kabupaten Ogan Komering Ilir',
    kecamatan: [
      { id: '160201', name: 'Kayu Agung', kelurahan: ['Cintaraja', 'Kayuagung Asli', 'Kutaraya', 'Mangunjaya', 'Pakintan', 'Sukaraja'] },
      { id: '160202', name: 'Sirah Pulau Padang', kelurahan: ['Sirah Pulau Padang', 'Terkelap', 'Batu Ampar', 'Pantai'] },
      { id: '160203', name: 'Pedamaran', kelurahan: ['Pedamaran I', 'Pedamaran II', 'Pedamaran III', 'Pedamaran VI'] },
      { id: '160204', name: 'Lempuing', kelurahan: ['Tugu Mulyo', 'Dabuk Rejo', 'Sindang Sari', 'Tebing Suluh'] },
      { id: '160205', name: 'Mesuji', kelurahan: ['Surya Adi', 'Pematang Panggang', 'Margo Bakti'] }
    ]
  },
  {
    id: '1603',
    name: 'Kabupaten Muara Enim',
    kecamatan: [
      { id: '160301', name: 'Muara Enim', kelurahan: ['Muara Enim', 'Pasar I', 'Pasar II', 'Pasar III', 'Tunggikal'] },
      { id: '160302', name: 'Lawang Kidul', kelurahan: ['Tanjung Enim', 'Tanjung Enim Selatan', 'Kebur', 'Lingga', 'Tegal Rejo'] },
      { id: '160303', name: 'Tanjung Agung', kelurahan: ['Tanjung Agung', 'Muara Meo', 'Paduraksa', 'Tanjung Karangan'] },
      { id: '160304', name: 'Gelumbang', kelurahan: ['Gelumbang', 'Binuang', 'Gambut', 'Jambabu'] },
      { id: '160305', name: 'Gunung Megang', kelurahan: ['Gunung Megang Dalam', 'Gunung Megang Luar', 'Lubuk Mumpo'] }
    ]
  },
  {
    id: '1604',
    name: 'Kabupaten Lahat',
    kecamatan: [
      { id: '160401', name: 'Lahat', kelurahan: ['Bandar Jaya', 'Pasar Baru', 'Pasar Lama', 'Kota Jaya', 'Talang Jawa'] },
      { id: '160402', name: 'Lahat Selatan', kelurahan: ['Tanjung Payang', 'Karang Baru', 'Banjar Negara'] },
      { id: '160403', name: 'Merapi Barat', kelurahan: ['Lebak Budi', 'Muara Temiang', 'Tanjung Baru', 'Telatang'] },
      { id: '160404', name: 'Kikim Timur', kelurahan: ['Bungamas', 'Gedung Agung', 'Linggar Jaya', 'Patikal Baru'] },
      { id: '160405', name: 'Kota Agung', kelurahan: ['Kota Agung', 'Bangkai', 'Pajar Bulan', 'Tanjung Raman'] }
    ]
  },
  {
    id: '1606',
    name: 'Kabupaten Musi Banyuasin',
    kecamatan: [
      { id: '160601', name: 'Sekayu', kelurahan: ['Balai Agung', 'Kayu Ara', 'Serasan Jaya', 'Sohar', 'Lumpatan'] },
      { id: '160602', name: 'Sungai Lilin', kelurahan: ['Sungai Lilin', 'Sungai Lilin Jaya', 'Pinang Banjar', 'Cinta Damai'] },
      { id: '160603', name: 'Bayung Lencir', kelurahan: ['Bayung Lencir', 'Bayung Lencir Indah', 'Mekar Jaya', 'Muara Bahar'] },
      { id: '160604', name: 'Babat Toman', kelurahan: ['Babat', 'Mangun Jaya', 'Kasmaran', 'Sereka'] },
      { id: '160605', name: 'Lais', kelurahan: ['Lais', 'Lais Utara', 'Tanjung Agung', 'Petaling'] }
    ]
  },
  {
    id: '1605',
    name: 'Kabupaten Musi Rawas',
    kecamatan: [
      { id: '160501', name: 'Muara Beliti', kelurahan: ['Pasar Muara Beliti', 'Muara Beliti Baru', 'Bumi Agung', 'Mani Manis'] },
      { id: '160502', name: 'Tugumulyo', kelurahan: ['Srikaton', 'Dwijaya', 'Mataram', 'Ngasem', 'Tegal Rejo'] },
      { id: '160503', name: 'Purwodadi', kelurahan: ['Purwodadi', 'Bangka Jaya', 'Kertosono', 'Pagersari'] },
      { id: '160504', name: 'Megang Sakti', kelurahan: ['Megang Sakti I', 'Campur Sari', 'Mekar Sari', 'Tegal Sari'] }
    ]
  },
  {
    id: '1613',
    name: 'Kabupaten Musi Rawas Utara',
    kecamatan: [
      { id: '161301', name: 'Rupit', kelurahan: ['Muara Rupit', 'Batu Gajah', 'Maur Baru', 'Tanjung Beringin'] },
      { id: '161302', name: 'Rawas Ulu', kelurahan: ['Pasar Surulangun', 'Surulangun', 'Sungai Kijang', 'Teladas'] },
      { id: '161303', name: 'Rawas Ilir', kelurahan: ['Bingin Teluk', 'Batu Kucing', 'Pauh', 'Air Bening'] }
    ]
  },
  {
    id: '1601',
    name: 'Kabupaten Ogan Komering Ulu',
    kecamatan: [
      { id: '160101', name: 'Baturaja Timur', kelurahan: ['Baturaja Lama', 'Baturaja Permai', 'Kemalaraja', 'Pasar Baru', 'Sukaraya', 'Sekar Jaya'] },
      { id: '160102', name: 'Baturaja Barat', kelurahan: ['Air Gading', 'Batu Kuning', 'Saung Naga', 'Tanjung Agung'] },
      { id: '160103', name: 'Lubuk Raja', kelurahan: ['Batumarta I', 'Batumarta II', 'Batahan', 'Marta Jaya'] },
      { id: '160104', name: 'Pengandonan', kelurahan: ['Pengandonan', 'Gunung Liwat', 'Ujan Mas', 'Kesambirata'] }
    ]
  },
  {
    id: '1608',
    name: 'Kabupaten Ogan Komering Ulu Timur',
    kecamatan: [
      { id: '160801', name: 'Martapura', kelurahan: ['Pakutanduk', 'Paku Sengkunyit', 'Terukis Rahayu', 'Dusun Martapura'] },
      { id: '160802', name: 'Belitang', kelurahan: ['Gumamuk I', 'Gumamuk II', 'Harjowinangun', 'Pujorahayu', 'Sido Gede'] },
      { id: '160803', name: 'Belitang Madang Raya', kelurahan: ['Tugu Mulyo', 'Rantau Jaya', 'Margo Mulyo', 'Karang Binangun'] },
      { id: '160804', name: 'Buay Madang', kelurahan: ['Kurungan Nyawa', 'Tanjung Bulan', 'Sridadi', 'Way Halom'] }
    ]
  },
  {
    id: '1609',
    name: 'Kabupaten Ogan Komering Ulu Selatan',
    kecamatan: [
      { id: '160901', name: 'Muaradua', kelurahan: ['Pasar Muaradua', 'Bumi Agung', 'Pancur Pungah', 'Batu Belang Jaya'] },
      { id: '160902', name: 'Banding Agung', kelurahan: ['Bandar Agung Ranau', 'Surabaya Ranau', 'Rantau Nipis'] },
      { id: '160903', name: 'Buay Sandang Aji', kelurahan: ['Kenali', 'Gunung Terang', 'Negeri Agung', 'Tanjung Iman'] },
      { id: '160904', name: 'Pulau Beringin', kelurahan: ['Pulau Beringin', 'Pagar Agung', 'Kembahang', 'Simpang Pancur'] }
    ]
  },
  {
    id: '1611',
    name: 'Kabupaten Empat Lawang',
    kecamatan: [
      { id: '161101', name: 'Tebing Tinggi', kelurahan: ['Pasar Tebing Tinggi', 'Kupang', 'Tanjung Kupang', 'Jayaloka'] },
      { id: '161102', name: 'Pendopo', kelurahan: ['Pagar Tengah', 'Pendopo', 'Beruge Ilir', 'Tanjung Raman'] },
      { id: '161103', name: 'Muara Pinang', kelurahan: ['Muara Pinang Baru', 'Sukarami', 'Gedung Agung', 'Sapa Panjang'] },
      { id: '161104', name: 'Ulu Musi', kelurahan: ['Padang Tepong', 'Simpang Perigi', 'Kunduran', 'Muara Betung'] }
    ]
  },
  {
    id: '1612',
    name: 'Kabupaten Penukal Abab Lematang Ilir',
    kecamatan: [
      { id: '161201', name: 'Talang Ubi', kelurahan: ['Talang Ubi Timur', 'Talang Ubi Barat', 'Talang Ubi Selatan', 'Talang Ubi Utara', 'Handayani Mulya'] },
      { id: '161202', name: 'Penukal', kelurahan: ['Babang Babat', 'Gunung Menang', 'Purun', 'Spontan'] },
      { id: '161203', name: 'Abab', kelurahan: ['Betung', 'Pengabuan', 'Prambatan', 'Tanjung Kurung'] },
      { id: '161204', name: 'Tanah Abang', kelurahan: ['Tanah Abang Selatan', 'Tanah Abang Utara', 'Modong', 'Lunas Sari'] }
    ]
  }
];

export function getKabKotaList(): { id: string; name: string }[] {
  return WILAYAH_SUMSEL.map((k) => ({ id: k.id, name: k.name }));
}

export function getKecamatanList(kabIdentifier: string): { id: string; name: string }[] {
  if (!kabIdentifier) return [];
  const found = WILAYAH_SUMSEL.find(
    (k) => k.id === kabIdentifier || k.name.toLowerCase() === kabIdentifier.toLowerCase()
  );
  if (!found) return [];
  return found.kecamatan.map((kec) => ({ id: kec.id, name: kec.name }));
}

export function getKelurahanList(kabIdentifier: string, kecIdentifier: string): string[] {
  if (!kabIdentifier || !kecIdentifier) return [];
  const kab = WILAYAH_SUMSEL.find(
    (k) => k.id === kabIdentifier || k.name.toLowerCase() === kabIdentifier.toLowerCase()
  );
  if (!kab) return [];
  const kec = kab.kecamatan.find(
    (c) => c.id === kecIdentifier || c.name.toLowerCase() === kecIdentifier.toLowerCase()
  );
  if (!kec) return [];
  return kec.kelurahan;
}
