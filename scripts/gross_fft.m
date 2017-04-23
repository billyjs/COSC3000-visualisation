% matlab script for getting fft data from gross data
Fs = 1;
T = 1/Fs;
L = 372;
t = (0:L-1)*T;

plot(t, gross)


Y = fft(gross);

P2 = abs(Y/L);
P1 = P2(1:L/2+1);
P1(2:end-1) = 2*P1(2:end-1);

f = Fs*(0:(L/2))/L;
plot(f,P1)

csvwrite('grossfft.csv', [f', P1]);