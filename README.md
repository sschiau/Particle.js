#Particle 
###64bits int Time Based ID Generator
JavaScript extended implementation of Twitter Snowflake ID Generator (Extended to 42bits epoch for 96 years 1 month 21 days 16 hours 42 minutes 24 seconds in the future)


## Uncoordinated
For high availability within and across data centers, machines generating ids should not have to coordinate with each other.

##  Solution
* id (64 bits) is composed of:
  * time - 42 bits (millisecond precision w/ a custom epoch gives us 96 years 1 month 21 days 16 hours 42 minutes 24 seconds in the future)
  * configured machine id - 10 bits - up to 1024 machines
  * sequence number - 12 bits - up to 4096 random numbers

### System Clock Dependency
You should use NTP to keep your system clock accurate.

## How to use it
### Generate Particle ID
### Time from Particle ID (w/ milisecond precision)
Check Demo.html gile

## License
Apache License Version 2.0
http://www.apache.org/licenses/LICENSE-2.0.txt
