#include <stdio.h>

int main() {

    int rupee, paise;
    printf("Enter amount in rupees  ");
    scanf("%d", &rupee);
    
    paise = rupee * 100;
    printf("Amount in paise: %d\n", paise);
    return 0;
}