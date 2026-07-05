Uruchomienie aplikacji:
* zbudować obraz kontenera za pomocą polecenia: docker build -t radio-project .
* uruchomić kontener używając komendy: docker run --rm -p 3000:3000 radio-project

Opis:
Aplikacja zawiera player, mini player, napisy. Dostarcza podstawową dostępność 
w postaci sterowania za pomocą klawiatury(spacja-zatrzymaj/wznów, strzałki-przewijanie odcinka, "m"-wycisz/odcisz), aria-label, aria-pressed, aria-live,
ustawiania fokusu(na odtwarzacz po doborze odcinka).
Zaimplementowano przycisk do powrotu do odtwarzanego odcinka na liście (w celu wygodnego przeglądania kolejnych propozycji).
Mini player ma możliwość "schowania się".
Logika multimediów została zamknięta w hooku useMediaPlaybackController 
i zawiera możliwe czynności oraz stan odtwarzania, w tym głośność, wyciszenie oraz referencję do elementu wideo lub audio
Oba playery są w "kontenerze", który jednokrotnie wywołuje useMediaPlaybackController i przekazuje go do playerów.
Dzięki temu nie ma oddzielnych elementów audio/wideo dla playera i mini playera, a odtwarzanie przechodzi płynnie pomiędzy nimi.
W kodzie aplikacji można zauważyć podział na warstwę odpowiedzialną za prezentacji, logikę, integrację z API oraz modele danych.


Czas:
10h

