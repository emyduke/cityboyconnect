from django.core.management.base import BaseCommand
from apps.structure.models import GeopoliticalZone, State, LocalGovernment, Ward


# All 36 states + FCT with zone assignments and representative LGAs
NIGERIA_DATA = {
    'North Central': {
        'code': 'NC',
        'states': {
            'Benue': {'code': 'BN', 'lgas': ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Vandeikya']},
            'FCT': {'code': 'FC', 'lgas': ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council']},
            'Kogi': {'code': 'KG', 'lgas': ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela-Odolu', 'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa-Muro', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West']},
            'Kwara': {'code': 'KW', 'lgas': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke-Ero', 'Oyun', 'Patigi']},
            'Nasarawa': {'code': 'NS', 'lgas': ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Nasarawa-Eggon', 'Obi', 'Toto', 'Wamba']},
            'Niger': {'code': 'NG', 'lgas': ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Munya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi']},
            'Plateau': {'code': 'PL', 'lgas': ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', 'Qua\'an Pan', 'Riyom', 'Shendam', 'Wase']},
        }
    },
    'North East': {
        'code': 'NE',
        'states': {
            'Adamawa': {'code': 'AD', 'lgas': ['Demsa', 'Fufore', 'Ganye', 'Girei', 'Gombi', 'Guyuk', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo-Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South']},
            'Bauchi': {'code': 'BA', 'lgas': ['Alkaleri', 'Bauchi', 'Bogoro', 'Dambam', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa', 'Giade', 'Itas/Gadau', 'Jama\'are', 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa-Balewa', 'Toro', 'Warji', 'Zaki']},
            'Borno': {'code': 'BO', 'lgas': ['Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga', 'Kukawa', 'Kwaya-Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani']},
            'Gombe': {'code': 'GM', 'lgas': ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba']},
            'Taraba': {'code': 'TB', 'lgas': ['Ardo-Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim-Lamido', 'Kurmi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing']},
            'Yobe': {'code': 'YB', 'lgas': ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari']},
        }
    },
    'North West': {
        'code': 'NW',
        'states': {
            'Jigawa': {'code': 'JG', 'lgas': ['Auyo', 'Babura', 'Biriniwa', 'Birnin-Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin-Hausa', 'Kaugama', 'Kazaure', 'Kiri Kasamma', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule-Tankarkar', 'Taura', 'Yankwashi']},
            'Kaduna': {'code': 'KD', 'lgas': ['Birnin-Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon-Gari', 'Sanga', 'Soba', 'Zangon-Kataf', 'Zaria']},
            'Kano': {'code': 'KN', 'lgas': ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil']},
            'Katsina': {'code': 'KT', 'lgas': ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dan Musa', 'Dandume', 'Danja', 'Daura', 'Dutsi', 'Dutsin-Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada', 'Mai\'Adua', 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango']},
            'Kebbi': {'code': 'KB', 'lgas': ['Aleiro', 'Arewa-Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru']},
            'Sokoto': {'code': 'SK', 'lgas': ['Binji', 'Bodinga', 'Dange-Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo']},
            'Zamfara': {'code': 'ZM', 'lgas': ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Tsafe', 'Zurmi']},
        }
    },
    'South East': {
        'code': 'SE',
        'states': {
            'Abia': {'code': 'AB', 'lgas': ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala-Ngwa North', 'Isiala-Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma Ngwa', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu-Nneochi']},
            'Anambra': {'code': 'AN', 'lgas': ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi']},
            'Ebonyi': {'code': 'EB', 'lgas': ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha']},
            'Enugu': {'code': 'EN', 'lgas': ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo-Etiti', 'Igbo-Eze North', 'Igbo-Eze South', 'Isi-Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji-River', 'Udenu', 'Udi', 'Uzo-Uwani']},
            'Imo': {'code': 'IM', 'lgas': ['Aboh-Mbaise', 'Ahiazu-Mbaise', 'Ehime-Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor-Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Onuimo', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West']},
        }
    },
    'South South': {
        'code': 'SS',
        'states': {
            'Akwa Ibom': {'code': 'AK', 'lgas': ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat Enin', 'Nsit Atai', 'Nsit Ibom', 'Nsit Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo']},
            'Bayelsa': {'code': 'BY', 'lgas': ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa']},
            'Cross River': {'code': 'CR', 'lgas': ['Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala']},
            'Delta': {'code': 'DT', 'lgas': ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North-East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West']},
            'Edo': {'code': 'ED', 'lgas': ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba-Okha', 'Oredo', 'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde']},
            'Rivers': {'code': 'RV', 'lgas': ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obia/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai']},
        }
    },
    'South West': {
        'code': 'SW',
        'states': {
            'Ekiti': {'code': 'EK', 'lgas': ['Ado-Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido-Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye']},
            'Lagos': {'code': 'LA', 'lgas': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere']},
            'Ogun': {'code': 'OG', 'lgas': ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko-Afon', 'Ipokia', 'Obafemi-Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Sagamu']},
            'Ondo': {'code': 'OD', 'lgas': ['Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Ese-Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile-Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo']},
            'Osun': {'code': 'OS', 'lgas': ['Aiyedade', 'Aiyedire', 'Atakunmosa East', 'Atakunmosa West', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo-Otin', 'Ola-Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo']},
            'Oyo': {'code': 'OY', 'lgas': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomoso North', 'Ogbomoso South', 'Ogo Oluwa', 'Oluyole', 'Ona-Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere']},
        }
    },
}


class Command(BaseCommand):
    help = 'Seed Nigeria political structure: Zones, States, LGAs, and sample Wards'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Nigeria political structure...')

        zone_count = 0
        state_count = 0
        lga_count = 0
        ward_count = 0

        for zone_name, zone_data in NIGERIA_DATA.items():
            zone, created = GeopoliticalZone.objects.get_or_create(
                code=zone_data['code'],
                defaults={'name': zone_name},
            )
            if created:
                zone_count += 1

            for state_name, state_data in zone_data['states'].items():
                state, created = State.objects.get_or_create(
                    code=state_data['code'],
                    defaults={'name': state_name, 'zone': zone},
                )
                if created:
                    state_count += 1

                for lga_name in state_data['lgas']:
                    lga, created = LocalGovernment.objects.get_or_create(
                        name=lga_name,
                        state=state,
                    )
                    if created:
                        lga_count += 1

                    # Create sample wards for each LGA
                    for i in range(1, 11):
                        ward, created = Ward.objects.get_or_create(
                            name=f'{lga_name} Ward {i}',
                            lga=lga,
                            defaults={'ward_code': f'{state_data["code"]}-{lga_name[:3].upper()}-W{i:02d}'},
                        )
                        if created:
                            ward_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done! Created: {zone_count} zones, {state_count} states, '
            f'{lga_count} LGAs, {ward_count} wards'
        ))
